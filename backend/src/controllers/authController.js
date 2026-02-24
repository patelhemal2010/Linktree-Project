const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// uuid removed as DB handles it

// ==========================
// REGISTER
// ==========================
exports.register = async (req, res) => {
  const { name, email, password, username } = req.body;

  // Basic validation
  if (!name || !email || !password || !username) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    // Check if user exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email=$1 OR username=$2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email or username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    // Insert new user
    // DB generates ID (uuid_generate_v4) and created_at automatically
    // Assign default theme (ID 1 = Classic White) if not provided? Or let DB handle defaults?
    // Let's rely on DB for ID, but fetch Theme #1 as default if `theme_id` is missing
    const defaultThemeId = 1;

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, username, theme_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, username, theme_id, is_pro`,
      [name, email, hashedPassword, username, defaultThemeId]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser.rows[0],
      token,
    });

  } catch (error) {
    console.error("Register Error Detailed:", error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: "Username or Email already exists"
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

// ==========================
// LOGIN
// ==========================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    // Get user
    const user = await pool.query(
      "SELECT id, name, email, username, password FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        username: user.rows[0].username,
      },
      token,
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================
// UPDATE USER
// ==========================
exports.updateUser = async (req, res) => {
  const { name, email, username, profile_image } = req.body;
  const userId = req.user.id;

  try {
    // Check if new email or username is already taken by someone else
    const checkUser = await pool.query(
      "SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3",
      [email, username, userId]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email or username already taken" });
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email),
           username = COALESCE($3, username),
           profile_image = COALESCE($4, profile_image)
       WHERE id = $5 
       RETURNING id, name, email, username, is_pro, profile_image`,
      [name, email, username, profile_image, userId]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
