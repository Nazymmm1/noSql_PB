const Post = require("../models/Post");
const path = require("path");
const fs = require("fs");

exports.createPost = async (req, res) => {
  try {
    console.log("📝 Creating post...");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    
    const postData = {
      title: req.body.title,
      content: req.body.content,
      author: req.userId,
      tags: req.body.tags
    };

    // If image was uploaded, add the image path
    if (req.file) {
      postData.image = `/uploads/${req.file.filename}`;
      console.log("✅ Image added to post:", postData.image);
    } else {
      console.log("ℹ️  No image uploaded");
    }

    const post = await Post.create(postData);
    console.log("✅ Post created successfully:", post._id);
    res.status(201).json(post);
  } catch (error) {
    console.error("❌ Error creating post:", error);
    
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      const filePath = path.join(__dirname, "..", "..", "uploads", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🗑️ Cleaned up uploaded file after error");
      }
    }
    res.status(500).json({ message: "Error creating post", error: error.message });
  }
};

exports.getPosts = async (req, res) => {
  const posts = await Post.find().populate("author", "username");
  res.json(posts);
};

exports.updatePost = async (req, res) => {
  try {
    const allowedFields = ["title", "content", "tags"];
    const update = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    // If new image was uploaded
    if (req.file) {
      // Get the old post to delete old image
      const oldPost = await Post.findById(req.params.id);
      
      if (oldPost && oldPost.image) {
        // Delete old image file
        const oldImagePath = path.join(__dirname, "..", "..", oldPost.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      update.image = `/uploads/${req.file.filename}`;
    }

    if (req.body.removeImage === 'true') {
      const oldPost = await Post.findById(req.params.id);
      
      if (oldPost && oldPost.image) {
        const oldImagePath = path.join(__dirname, "..", "..", oldPost.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      update.image = null;
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error updating post", error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    // Delete associated image if exists
    if (post && post.image) {
      const imagePath = path.join(__dirname, "..", "..", post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error: error.message });
  }
};

exports.addComment = async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        comments: {
          userId: req.userId,
          text: req.body.text
        }
      }
    },
    { new: true }
  );
  res.json(post);
};

// UPDATED: Toggle like (like/unlike)
exports.likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const userIndex = post.likes.indexOf(req.userId);
  
  if (userIndex > -1) {
    // Unlike: user already liked, so remove
    post.likes.splice(userIndex, 1);
    await post.save();
    return res.json({ message: "Post unliked", likesCount: post.likes.length, liked: false });
  } else {
    // Like: add user to likes
    post.likes.push(req.userId);
    await post.save();
    return res.json({ message: "Post liked", likesCount: post.likes.length, liked: true });
  }
};

exports.deleteComment = async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.postId,
    {
      $pull: {
        comments: { _id: req.params.commentId }
      }
    },
    { new: true }
  );
  res.json(post);
};

exports.getPostById = async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("author", "username");
  res.json(post);
};

exports.getComments = async (req, res) => {
  const post = await Post.findById(req.params.id).select("comments");
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  res.json(post.comments);
};

exports.searchByTag = async (req, res) => {
  const { tag } = req.query;

  if (!tag) {
    return res.status(400).json({ message: "Tag is required" });
  }

  const posts = await Post.find({
    tags: { $in: [tag] }
  }).populate("author", "username");

  res.json(posts);
};

// UPDATED: Better reaction handling
exports.reactToPost = async (req, res) => {
  const { type } = req.body;
  const userId = req.userId;

  if (!["👍", "❤️", "😂", "😭", "😡"].includes(type)) {
    return res.status(400).json({ message: "Invalid reaction type" });
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  // Find if user already reacted
  const existingReactionIndex = post.reactions.findIndex(
    r => r.userId.toString() === userId.toString()
  );

  if (existingReactionIndex > -1) {
    // If same reaction, remove it (toggle off)
    if (post.reactions[existingReactionIndex].type === type) {
      post.reactions.splice(existingReactionIndex, 1);
      await post.save();
      return res.json({ message: "Reaction removed", post });
    } else {
      // Different reaction, update it
      post.reactions[existingReactionIndex].type = type;
    }
  } else {
    // No existing reaction, add new one
    post.reactions.push({ userId, type });
  }

  await post.save();
  res.json({ message: "Reaction updated", post });
};

// UPDATED: Toggle comment like
exports.likeComment = async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const userIndex = comment.likes.indexOf(req.userId);

  if (userIndex > -1) {
    // Unlike
    comment.likes.splice(userIndex, 1);
    await post.save();
    return res.json({ message: "Comment unliked", liked: false });
  } else {
    // Like
    comment.likes.push(req.userId);
    await post.save();
    return res.json({ message: "Comment liked", liked: true });
  }
};