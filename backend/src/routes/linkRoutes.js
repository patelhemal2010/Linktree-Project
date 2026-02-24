const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const linkController = require("../controllers/linkController");

// ==========================
// Protected Routes
// ==========================

router.post("/", authMiddleware, linkController.addLink);

router.get("/", authMiddleware, linkController.getMyLinks);

router.put("/reorder", authMiddleware, linkController.reorderLinks);

router.put("/:id", authMiddleware, linkController.updateLink);

router.delete("/:id", authMiddleware, linkController.deleteLink);

router.get("/:id", authMiddleware, linkController.getSingleLink);

router.get("/:id/analytics", authMiddleware, linkController.getLinkAnalytics);

module.exports = router;
