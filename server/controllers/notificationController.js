const asyncHandler = require('../middleware/asyncHandler');
const Notification = require('../models/Notification');

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.json({ notifications, unreadCount });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });

  notification.isRead = true;
  await notification.save();

  res.json(notification);
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
