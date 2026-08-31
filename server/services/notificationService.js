const Notification = require('../models/Notification');
const { emitToUser } = require('../socket/socket');

// Creates a notification in MongoDB AND pushes it in real-time if the user is online
const createNotification = async ({ recipient, sender, type, message, relatedTask, relatedProject }) => {
  // Don't notify a user about their own action
  if (sender && recipient.toString() === sender.toString()) return null;

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    message,
    relatedTask,
    relatedProject,
  });

  const populated = await notification.populate('sender', 'name avatar');

  emitToUser(recipient, 'notification:new', populated);

  return populated;
};

module.exports = { createNotification };
