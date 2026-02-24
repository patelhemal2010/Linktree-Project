const pool = require("../config/db");

// ==========================
// FULL USER DASHBOARD ANALYTICS
// ==========================
exports.getDashboardAnalytics = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get all link IDs of user
    const linkIdsResult = await pool.query(
      `SELECT id FROM links WHERE user_id = $1`,
      [userId]
    );

    const linkIds = linkIdsResult.rows.map(row => row.id);

    if (linkIds.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalClicks: 0,
          uniqueVisitors: 0,
          todayClicks: 0,
          last7Days: [],
          topLinks: [],
          devices: [],
          topCountries: [],
          referrers: []
        }
      });
    }

    // Total clicks
    const total = await pool.query(
      `SELECT COUNT(*) FROM analytics
       WHERE link_id = ANY($1::uuid[])`,
      [linkIds]
    );

    // Unique visitors
    const unique = await pool.query(
      `SELECT COUNT(DISTINCT ip_address)
       FROM analytics
       WHERE link_id = ANY($1::uuid[])`,
      [linkIds]
    );

    // Today clicks
    const today = await pool.query(
      `SELECT COUNT(*)
       FROM analytics
       WHERE link_id = ANY($1::uuid[])
       AND DATE(clicked_at) = CURRENT_DATE`,
      [linkIds]
    );

    // Last 7 days
    const last7Days = await pool.query(
      `SELECT DATE(clicked_at) as date,
              COUNT(*) as clicks
       FROM analytics
       WHERE link_id = ANY($1::uuid[])
       AND clicked_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date ASC`,
      [linkIds]
    );

    // Top performing links
    const topLinks = await pool.query(
      `SELECT l.title, COUNT(c.id) as clicks
       FROM links l
       LEFT JOIN analytics c ON l.id = c.link_id
       WHERE l.user_id = $1
       GROUP BY l.id
       ORDER BY clicks DESC
       LIMIT 5`,
      [userId]
    );

    // Device breakdown
    const devices = await pool.query(
      `SELECT device, COUNT(*) as count
       FROM analytics
       WHERE link_id = ANY($1::uuid[])
       GROUP BY device`,
      [linkIds]
    );

    // Top countries
    const countries = await pool.query(
      `SELECT country, COUNT(*) as count
       FROM analytics
       WHERE link_id = ANY($1::uuid[])
       GROUP BY country
       ORDER BY count DESC
       LIMIT 5`,
      [linkIds]
    );

    // Referrers
    const referrers = await pool.query(
      `SELECT referer, COUNT(*) as count
       FROM analytics
       WHERE link_id = ANY($1::uuid[])
       GROUP BY referer
       ORDER BY count DESC
       LIMIT 5`,
      [linkIds]
    );

    res.json({
      success: true,
      analytics: {
        totalClicks: parseInt(total.rows[0].count),
        uniqueVisitors: parseInt(unique.rows[0].count),
        todayClicks: parseInt(today.rows[0].count),
        last7Days: last7Days.rows,
        topLinks: topLinks.rows,
        devices: devices.rows,
        topCountries: countries.rows,
        referrers: referrers.rows
      }
    });

  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
