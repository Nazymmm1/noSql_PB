const Post = require("../models/Post");

exports.createPost = async (req, res) => {
  const post = await Post.create({
    title: req.body.title,
    content: req.body.content,
    author: req.userId,
    tags : req.body.tags
  });
  res.status(201).json(post);
};

exports.getPosts = async (req, res) => {
  const posts = await Post.find().populate("author", "username");
  res.json(posts);
};

exports.updatePost = async (req, res) => {
  const allowedFields = ["title", "content", "tags"];
  const update = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      update[field] = req.body[field];
    }
  });

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true }
  );

  res.json(post);
};


exports.deletePost = async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Post deleted" });
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
  });

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