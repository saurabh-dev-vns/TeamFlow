const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const { generateToken, setTokenCookie } = require('../utils/generateToken');

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

  const changingPassword = Boolean(req.body.password);

  if (req.body.name) user.name = req.body.name;
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
  if (changingPassword) user.password = req.body.password;

  const updated = await user.save();

  // Changing your own password bumps tokenVersion (see User model), which
  // invalidates every previously-issued token — including the one on this
  // request. Reissue a fresh cookie so this session keeps working; any
  // *other* logged-in sessions/devices are correctly logged out.
  if (changingPassword) {
    const token = generateToken(updated);
    setTokenCookie(res, token);
  }

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    avatar: updated.avatar,
    role: updated.role,
    createdAt: updated.createdAt,
  });
});

// @desc    Change another user's role (the only way to create an admin now
//          that public registration always defaults to 'member')
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ message: "Role must be 'admin' or 'member'" });
  }

  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.role = role;
  await user.save();

  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
});

module.exports = { getUsers, updateProfile, updateUserRole };
