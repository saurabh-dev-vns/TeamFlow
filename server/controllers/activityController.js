const asyncHandler = require('../middleware/asyncHandler');
const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const Task = require('../models/Task');

const assertProjectAccess = (project, user) => {
  if (user.role === 'admin') return true;
  return (
    String(project.owner) === String(user._id) ||
    project.members.some((m) => String(m) === String(user._id))
  );
};

// @desc    Get the activity feed for a project (all tasks + project-level events)
// @route   GET /api/projects/:id/activity
// @access  Private (project members / admin)
const getProjectActivity = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).select('owner members');
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const hasAccess = assertProjectAccess(project, req.user);
  if (!hasAccess) return res.status(403).json({ message: 'You do not have access to this project' });

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

  const [entries, total] = await Promise.all([
    ActivityLog.find({ project: project._id })
      .populate('user', 'name avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ActivityLog.countDocuments({ project: project._id }),
  ]);

  res.json({ entries, page, pages: Math.ceil(total / limit) || 1, total });
});

// @desc    Get the activity feed for a single task
// @route   GET /api/tasks/:id/activity
// @access  Private (project members / admin)
const getTaskActivity = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project', 'owner members');
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const hasAccess = assertProjectAccess(task.project, req.user);
  if (!hasAccess) return res.status(403).json({ message: 'You do not have access to this task' });

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

  const [entries, total] = await Promise.all([
    ActivityLog.find({ task: task._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ActivityLog.countDocuments({ task: task._id }),
  ]);

  res.json({ entries, page, pages: Math.ceil(total / limit) || 1, total });
});

module.exports = { getProjectActivity, getTaskActivity };
