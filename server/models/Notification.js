const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['TASK_ASSIGNED', 'NEW_COMMENT', 'DUE_SOON', 'MEMBER_ADDED', 'TASK_STATUS'],
      required: true,
    },
    message: { type: String, required: true },
    relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
