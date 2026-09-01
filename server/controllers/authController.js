const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ message: 'An account with this email already exists' });
  }

  // SECURITY: role is never taken from the request body on public registration.
  // Every self-registered account is a plain member; promotion to admin can
  // only be done by an existing admin via PATCH /api/users/:id/role.
  const user = await User.create({ name, email, password, role: 'member' });

  const token = generateToken(user);
  setTokenCookie(res, token);

  res.status(201).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken(user);
  setTokenCookie(res, token);

  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// @desc    Logout user: clears the auth cookie server-side (the JWT itself
//          is short-lived; see updateProfile for full "log out everywhere"
//          via tokenVersion invalidation on password change)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out successfully' });
});

module.exports = { register, login, getMe, logout };
