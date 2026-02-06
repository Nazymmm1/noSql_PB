const User = require("../models/User");
const Post = require("../models/Post");

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ author: req.params.id });

    // Get total likes received on all user's posts
    const posts = await Post.find({ author: req.params.id });
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);

    // Get total comments received
    const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      stats: {
        postCount,
        totalLikes,
        totalComments
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get current logged-in user's profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ author: req.userId });

    // Get total likes received on all user's posts
    const posts = await Post.find({ author: req.userId });
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);

    // Get total comments received
    const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      stats: {
        postCount,
        totalLikes,
        totalComments
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.id })
      .populate("author", "username")
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};