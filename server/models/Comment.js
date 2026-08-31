const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    text: { type: String, required: [true, 'Comment text is required'], trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
