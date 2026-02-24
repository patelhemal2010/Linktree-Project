const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getDashboardAnalytics } = require("../controllers/dashboardController");

router.get("/analytics", authMiddleware, getDashboardAnalytics);

module.exports = router;
