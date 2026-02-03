const express = require("express");
const router = express.Router();
const { topPosts, postsPerUser } = require("../controllers/analytics.controller");


router.get("/top-posts", topPosts);
router.get("/posts-per-user", postsPerUser);
 
module.exports = router;
