const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');

// @desc    Get all users (for assigning tasks / adding members)
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('name email avatar role createdAt').sort({ name: 1 });
  res.json(users);
});

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (req.body.name) user.name = req.body.name;
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
  if (req.body.password) user.password = req.body.password;

  const updated = await user.save();

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    avatar: updated.avatar,
    role: updated.role,
    createdAt: updated.createdAt,
  });
});

module.exports = { getUsers, updateProfile };
