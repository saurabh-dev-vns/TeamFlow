const express = require('express');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
const { validate, createProjectRules } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

router.route('/').get(getProjects).post(authorize('admin'), createProjectRules, validate, createProject);
router
  .route('/:id')
  .get(getProjectById)
  .put(authorize('admin'), updateProject)
  .delete(authorize('admin'), deleteProject);

router.post('/:id/members', authorize('admin'), addMember);
router.delete('/:id/members/:userId', authorize('admin'), removeMember);

module.exports = router;
