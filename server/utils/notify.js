const Notification = require('../models/Notification');

// Creates a notification in the DB and emits it in real-time via Socket.IO
// if the recipient is currently connected.
const notify = async (io, { recipient, sender, type, message, relatedTask, relatedProject }) => {
  if (String(recipient) === String(sender)) return null; // don't notify yourself

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    message,
    relatedTask: relatedTask || null,
    relatedProject: relatedProject || null,
  });

  const populated = await notification.populate('sender', 'name avatar');

  if (io) {
    io.to(`user:${recipient}`).emit('notification:new', populated);
  }

  return populated;
};

module.exports = notify;
