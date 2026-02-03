const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
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


router.post("/", auth, createPost);
router.get("/", getPosts);
router.get("/search", searchByTag);
router.put("/:id", auth, updatePost);
router.delete("/:id", auth, deletePost);
router.post("/:id/comments", auth, addComment);
router.put("/:id/like", auth, likePost);
router.delete("/:postId/comments/:commentId", auth, deleteComment);
router.get("/:id", getPostById);
router.get("/:id/comments", getComments);
router.put("/:id/like", auth, likePost);
router.put("/:id/react", auth, reactToPost);
router.put("/:postId/comments/:commentId/like", auth, likeComment);


module.exports = router;
