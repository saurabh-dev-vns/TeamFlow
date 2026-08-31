const express = require('express');
const { getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Standalone comments route kept for API-structure completeness;
// primary comment routes are nested under /api/tasks/:taskId/comments
router.get('/task/:taskId', protect, getComments);

module.exports = router;
