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

exports.likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  if (post.likes.includes(req.userId)) {
    return res.status(400).json({ message: "You already liked this post" });
  }

  post.likes.push(req.userId);
  await post.save();

  res.json({ message: "Post liked", likesCount: post.likes.length });
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

  // Remove old reaction from this user
  post.reactions = post.reactions.filter(
    r => r.userId.toString() !== userId
  );

  // Add new reaction
  post.reactions.push({ userId, type });

  await post.save();
  res.json(post);
};




exports.likeComment = async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  if (comment.likes.includes(req.userId)) {
    return res.status(400).json({ message: "Already liked" });
  }

  comment.likes.push(req.userId);
  await post.save();

  res.json({ message: "Comment liked" });
};


