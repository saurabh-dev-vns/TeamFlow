const express = require('express');
const { getUsers, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getUsers);
router.put('/profile', updateProfile);

module.exports = router;
