const ActivityLog = require('../models/ActivityLog');

// Records an audit-trail entry and pushes it in real-time to anyone
// currently viewing that project (and, by extension, that task).
const logActivity = async (io, { project, task, user, action, message, meta }) => {
  const entry = await ActivityLog.create({
    project,
    task: task || null,
    user,
    action,
    message,
    meta: meta || null,
  });

  const populated = await entry.populate('user', 'name avatar');

  if (io) {
    io.to(`project:${project}`).emit('activity:new', populated);
  }

  return populated;
};

module.exports = logActivity;
