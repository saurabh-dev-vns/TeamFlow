const express = require('express');
const { getUsers, updateProfile, updateUserRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getUsers);
router.put('/profile', updateProfile);
router.patch('/:id/role', authorize('admin'), updateUserRole);

module.exports = router;
