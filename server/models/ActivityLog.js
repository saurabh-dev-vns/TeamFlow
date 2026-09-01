const mongoose = require('mongoose');

// An append-only audit trail entry. One row per meaningful action taken on
// a project or task. `message` is a precomputed human-readable string (same
// pattern as Notification) so the frontend can render the feed without
// needing to know every action type's phrasing.
const activityLogSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'PROJECT_CREATED',
        'PROJECT_UPDATED',
        'PROJECT_DELETED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED',
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_STATUS_CHANGED',
        'TASK_ASSIGNED',
        'TASK_DELETED',
        'CHECKLIST_ITEM_TOGGLED',
        'COMMENT_ADDED',
      ],
      required: true,
    },
    message: { type: String, required: true },
    // Optional structured detail for actions where "before/after" matters
    // (e.g. { from: 'Todo', to: 'In Progress' } for a status change).
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
