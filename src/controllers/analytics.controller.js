const Post = require("../models/Post");

exports.topPosts = async (req, res) => {
  const result = await Post.aggregate([
    { $project: { title: 1, commentCount: { $size: "$comments" } } },
    { $sort: { commentCount: -1 } },
    { $limit: 5 }
  ]);

  res.json(result);
};

exports.postsPerUser = async (req, res) => {
  const result = await Post.aggregate([
    { $group: { _id: "$author", totalPosts: { $sum: 1 } } },
    { $sort: { totalPosts: -1 } }
  ]);
  res.json(result);
};
