const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    tags: {
      type: [String],
      default: []
    },

    likes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: []
  }
]
,

    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["👍", "❤️", "😂", "😭", "😡"]}

      }
    ],
    comments: [commentSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
