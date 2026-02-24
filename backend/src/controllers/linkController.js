const pool = require("../config/db");
const geoip = require("geoip-lite");
const UAParser = require("ua-parser-js");

// ==========================
// HELPER: Get Real IP
// ==========================
const getClientIp = (req) => {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "";

  // Clean IPv6 prefix (::ffff:)
  if (ip.includes("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
};

// ==========================
// ADD LINK
// ==========================
exports.addLink = async (req, res) => {
  const { title, url, profile_id } = req.body;
  const userId = req.user.id;

  if (!profile_id) {
    return res.status(400).json({
      success: false,
      message: "Profile ID is required",
    });
  }

  try {
    const positionResult = await pool.query(
      `SELECT COALESCE(MAX(position), 0) + 1 AS next_position
       FROM links WHERE profile_id = $1`,
      [profile_id]
    );

    const nextPosition = positionResult.rows[0].next_position;

    const newLink = await pool.query(
      `INSERT INTO links (user_id, profile_id, title, url, position, platform)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, profile_id, (title || '').trim(), (url || '').trim(), nextPosition, req.body.platform || 'website']
    );

    res.status(201).json({
      success: true,
      link: newLink.rows[0],
    });

  } catch (error) {
    console.error("Add Link Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// Get My Links (For Dashboard)
// ==========================
exports.getMyLinks = async (req, res) => {
  const { profile_id } = req.query;
  const userId = req.user.id;

  if (!profile_id) return res.status(400).json({ success: false, message: "Profile ID is required" });

  try {
    const links = await pool.query(
      `SELECT * FROM links WHERE user_id = $1 AND profile_id = $2 ORDER BY position ASC`,
      [userId, profile_id]
    );

    res.json({
      success: true,
      links: links.rows,
    });

  } catch (error) {
    console.error("GetMyLinks Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ==========================
// UPDATE LINK
// ==========================

exports.updateLink = async (req, res) => {
  const { id } = req.params;
  const { title, url, is_active } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE links
       SET title = COALESCE($1, title),
           url = COALESCE($2, url),
           is_active = COALESCE($3, is_active),
           platform = COALESCE($4, platform)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        (title === undefined ? null : title),
        (url === undefined ? null : url),
        (is_active === undefined ? null : is_active),
        (req.body.platform === undefined ? null : req.body.platform),
        id,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    res.json({
      success: true,
      link: result.rows[0],
    });

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// DELETE LINK
// ==========================

exports.deleteLink = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM links
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    res.json({
      success: true,
      deletedId: id,
    });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// Get Single Link
// ==========================

exports.getSingleLink = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM links WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    res.json({
      success: true,
      link: result.rows[0],
    });

  } catch (error) {
    console.error("GetSingle Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ==========================
// REDIRECT + FULL TRACKING
// ==========================
exports.redirectAndTrack = async (req, res) => {
  const { id } = req.params;

  try {
    const linkResult = await pool.query(
      `SELECT url FROM links WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (linkResult.rows.length === 0) {
      return res.status(404).send("Link not found");
    }

    const targetUrl = linkResult.rows[0].url;

    // Increment total counter
    await pool.query(
      `UPDATE links SET click_count = click_count + 1 WHERE id = $1`,
      [id]
    );

    const ip = getClientIp(req);

    // Geo lookup
    const geo = geoip.lookup(ip);
    const country = geo?.country || "Unknown";
    const city = geo?.city || "Unknown";

    // Device + Browser detection
    const userAgent = req.headers["user-agent"] || "";
    const parser = new UAParser(userAgent);

    const deviceType =
      parser.getDevice().type || "desktop";

    const browser =
      parser.getBrowser().name || "Unknown";

    const referer = req.headers["referer"] || "Direct";

    await pool.query(
      `INSERT INTO analytics
       (link_id, ip_address, country, device, browser, referer)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, ip, country, deviceType, browser, referer]
    );

    return res.redirect(targetUrl);

  } catch (error) {
    console.error("Redirect Error:", error);
    res.status(500).send("Server error");
  }
};

// ==========================
// PROFESSIONAL ANALYTICS
// ==========================
exports.getLinkAnalytics = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const linkCheck = await pool.query(
      `SELECT id FROM links WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (linkCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const [
      total,
      unique,
      today,
      last7Days,
      devices,
      countries,
      referrers,
      browsers,
    ] = await Promise.all([

      pool.query(
        `SELECT COUNT(*) FROM analytics WHERE link_id = $1`,
        [id]
      ),

      pool.query(
        `SELECT COUNT(DISTINCT ip_address)
         FROM analytics WHERE link_id = $1`,
        [id]
      ),

      pool.query(
        `SELECT COUNT(*) FROM analytics
         WHERE link_id = $1
         AND DATE(clicked_at) = CURRENT_DATE`,
        [id]
      ),

      pool.query(
        `SELECT DATE(clicked_at) as date,
                COUNT(*) as clicks
         FROM analytics
         WHERE link_id = $1
         AND clicked_at >= CURRENT_DATE - INTERVAL '7 days'
         GROUP BY DATE(clicked_at)
         ORDER BY date ASC`,
        [id]
      ),

      pool.query(
        `SELECT device, COUNT(*) as count
         FROM analytics
         WHERE link_id = $1
         GROUP BY device`,
        [id]
      ),

      pool.query(
        `SELECT country, COUNT(*) as count
         FROM analytics
         WHERE link_id = $1
         GROUP BY country
         ORDER BY count DESC
         LIMIT 5`,
        [id]
      ),

      pool.query(
        `SELECT referer, COUNT(*) as count
         FROM analytics
         WHERE link_id = $1
         GROUP BY referer
         ORDER BY count DESC
         LIMIT 5`,
        [id]
      ),

      pool.query(
        `SELECT browser, COUNT(*) as count
         FROM analytics
         WHERE link_id = $1
         GROUP BY browser`,
        [id]
      ),

    ]);

    res.json({
      success: true,
      analytics: {
        totalClicks: Number(total.rows[0].count),
        uniqueVisitors: Number(unique.rows[0].count),
        todayClicks: Number(today.rows[0].count),
        last7Days: last7Days.rows,
        devices: devices.rows,
        browsers: browsers.rows,
        topCountries: countries.rows,
        referrers: referrers.rows,
      },
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================
// REORDER LINKS
// ==========================
exports.reorderLinks = async (req, res) => {
  const { orderedIds } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ success: false, message: "Invalid data format" });
  }

  try {
    const queries = orderedIds.map((linkId, index) => {
      // Ensure we only update links belonging to this user
      return pool.query(
        `UPDATE links SET position = $1 WHERE id = $2 AND user_id = $3`,
        [index, linkId, userId]
      );
    });

    await Promise.all(queries);

    res.json({ success: true, message: "Links reordered successfully" });

  } catch (error) {
    console.error("Reorder Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
