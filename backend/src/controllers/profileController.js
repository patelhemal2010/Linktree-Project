const pool = require("../config/db");

// ==========================
// GET PUBLIC PROFILE
// ==========================
// ==========================
// GET PUBLIC PROFILE
// ==========================
exports.getPublicProfile = async (req, res) => {
  const { username } = req.params; // username here is treated as the 'slug'

  try {
    // 1️⃣ Find profile
    const profileResult = await pool.query(
      `SELECT p.id, p.slug, p.bio, p.profile_image, p.appearance_settings, u.name as user_name, u.is_pro
             FROM profiles p
             JOIN users u ON p.user_id = u.id
             WHERE p.slug = $1`,
      [username]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const profileData = profileResult.rows[0];

    // 2️⃣ Get active links for this profile
    const linksResult = await pool.query(
      `SELECT id, title, url, position, platform
             FROM links
             WHERE profile_id = $1 AND is_active = true
             ORDER BY position ASC`,
      [profileData.id]
    );

    return res.json({
      success: true,
      profile: {
        username: profileData.slug,
        bio: profileData.bio,
        profile_image: profileData.profile_image,
        appearance: profileData.appearance_settings || {},
        links: linksResult.rows,
        name: profileData.user_name,
        is_pro: profileData.is_pro
      },
    });

  } catch (error) {
    console.error("Public Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================
// GET USER PROFILES
// ==========================
exports.getUserProfiles = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT * FROM profiles WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json({ success: true, profiles: result.rows });
  } catch (error) {
    console.error("Get User Profiles Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// CREATE NEW PROFILE
// ==========================
exports.createProfile = async (req, res) => {
  const { slug } = req.body;
  const userId = req.user.id;

  if (!slug) return res.status(400).json({ success: false, message: "Slug is required" });

  try {
    // Check if slug exists
    const check = await pool.query("SELECT id FROM profiles WHERE slug = $1", [slug]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: "This URL is already taken" });
    }

    const result = await pool.query(
      `INSERT INTO profiles (user_id, slug, appearance_settings) 
             VALUES ($1, $2, $3) RETURNING *`,
      [userId, slug, {
        backgroundColor: '#ffffff',
        pageTextColor: '#000000',
        buttonColor: '#F3F4F6',
        buttonTextColor: '#000000',
        buttonStyle: 'solid',
        buttonRoundness: 'rounder',
        wallpaperStyle: 'fill'
      }]
    );

    res.status(201).json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error("Create Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ==========================
   UPDATE PROFILE APPEARANCE
   ========================== */
exports.updateProfile = async (req, res) => {
  const { settings, profile_image, bio, profile_id } = req.body;
  const userId = req.user.id;

  if (!profile_id) return res.status(400).json({ success: false, message: "Profile ID is required" });

  try {
    const result = await pool.query(
      `UPDATE profiles 
             SET appearance_settings = COALESCE($1, appearance_settings), 
                 profile_image = COALESCE($2, profile_image),
                 bio = COALESCE($3, bio)
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
      [settings, profile_image, bio, profile_id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      profile: result.rows[0]
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// DELETE PROFILE
// ==========================
exports.deleteProfile = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "DELETE FROM profiles WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Profile not found or unauthorized" });
    }

    res.json({ success: true, message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Delete Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
