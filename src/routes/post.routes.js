const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  searchByTag,
  likePost,
  getComments,
  reactToPost,
  likeComment
} = require("../controllers/post.controller");

// Create post with optional image upload
// upload.single('image') means the field name in FormData should be 'image'
router.post("/", auth, upload.single('image'), createPost);

router.get("/", getPosts);
router.get("/search", searchByTag);

// Update post with optional image upload
router.put("/:id", auth, upload.single('image'), updatePost);

router.delete("/:id", auth, deletePost);
router.post("/:id/comments", auth, addComment);
router.put("/:id/like", auth, likePost);
router.delete("/:postId/comments/:commentId", auth, deleteComment);
router.get("/:id", getPostById);
router.get("/:id/comments", getComments);
router.put("/:id/react", auth, reactToPost);
router.put("/:postId/comments/:commentId/like", auth, likeComment);

module.exports = router;