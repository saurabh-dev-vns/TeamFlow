const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, registerRules, loginRules } = require('../middleware/validators');

const router = express.Router();

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
