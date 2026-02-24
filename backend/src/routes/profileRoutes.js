const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

const authMiddleware = require("../middleware/authMiddleware");

// Public route (NO auth middleware)
router.get("/:username", profileController.getPublicProfile);

// Update route (Protected)
router.get("/all/me", authMiddleware, profileController.getUserProfiles);
router.post("/create", authMiddleware, profileController.createProfile);
router.put("/update", authMiddleware, profileController.updateProfile);
router.delete("/:id", authMiddleware, profileController.deleteProfile);

module.exports = router;
