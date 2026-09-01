const asyncHandler = require('../middleware/asyncHandler');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const notify = require('../utils/notify');
const logActivity = require('../utils/logActivity');

// Same access rule used in taskController: admins can touch anything,
// everyone else must be the project owner or a member.
const assertProjectAccess = (project, user) => {
  if (user.role === 'admin') return true;
  return (
    String(project.owner) === String(user._id) ||
    project.members.some((m) => String(m) === String(user._id))
  );
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  const task = await Task.findById(req.params.taskId).populate('project');
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const hasAccess = assertProjectAccess(task.project, req.user);
  if (!hasAccess) return res.status(403).json({ message: 'You do not have access to this task' });

  const comment = await Comment.create({
    user: req.user._id,
    task: task._id,
    text: text.trim(),
  });

  const populated = await comment.populate('user', 'name avatar');

  const io = req.app.get('io');
  io?.to(`project:${task.project._id}`).emit('comment:new', { taskId: task._id, comment: populated });

  await logActivity(io, {
    project: task.project._id,
    task: task._id,
    user: req.user._id,
    action: 'COMMENT_ADDED',
    message: `${req.user.name} commented on "${task.title}"`,
  });

  // Notify the task's assignee and creator (if they aren't the commenter)
  const recipients = new Set(
    [task.assignedTo, task.createdBy].filter(Boolean).map((id) => String(id))
  );
  recipients.delete(String(req.user._id));

  for (const recipientId of recipients) {
    await notify(io, {
      recipient: recipientId,
      sender: req.user._id,
      type: 'NEW_COMMENT',
      message: `${req.user.name} commented on "${task.title}"`,
      relatedTask: task._id,
      relatedProject: task.project._id,
    });
  }

  res.status(201).json(populated);
});

// @desc    Get comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private
const getComments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId).populate('project');
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const hasAccess = assertProjectAccess(task.project, req.user);
  if (!hasAccess) return res.status(403).json({ message: 'You do not have access to this task' });

  const comments = await Comment.find({ task: req.params.taskId })
    .populate('user', 'name avatar')
    .sort({ createdAt: 1 });
  res.json(comments);
});

module.exports = { addComment, getComments };
