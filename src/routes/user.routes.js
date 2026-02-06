const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getUserProfile, getMyProfile, getUserPosts } = require("../controllers/user.controller");

// Get current user's profile (requires auth)
router.get("/me", auth, getMyProfile);

// Get any user's profile by ID
router.get("/:id", getUserProfile);

// Get user's posts
router.get("/:id/posts", getUserPosts);

module.exports = router;