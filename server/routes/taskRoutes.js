const express = require('express');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  toggleChecklistItem,
  deleteTask,
} = require('../controllers/taskController');
const { addComment, getComments } = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getTasks).post(authorize('admin'), createTask);
router
  .route('/:id')
  .get(getTaskById)
  .put(authorize('admin'), updateTask)
  .delete(authorize('admin'), deleteTask);

router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/checklist/:itemId', toggleChecklistItem);

router.route('/:taskId/comments').get(getComments).post(addComment);

module.exports = router;
