const asyncHandler = require('../middleware/asyncHandler');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const notify = require('../utils/notify');

// Helper: confirm the user is allowed to touch this project's tasks
const assertProjectAccess = async (project, user) => {
  if (user.role === 'admin') return true;
  const isMember =
    String(project.owner) === String(user._id) ||
    project.members.some((m) => String(m) === String(user._id));
  return isMember;
};

// @desc    Get tasks with optional search/filter/sort
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const { project, status, priority, assignedTo, search, sort, page, limit } = req.query;

  const filter = {};
  if (project) filter.project = project;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) filter.title = { $regex: search, $options: 'i' };

  // Members only see tasks in projects they belong to, or tasks assigned to them.
  if (req.user.role !== 'admin') {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');
    const projectIds = projects.map((p) => p._id);
    filter.project = filter.project
      ? filter.project
      : { $in: projectIds };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'dueDate') sortOption = { dueDate: 1 };
  if (sort === 'priority') sortOption = { priority: -1 };

  const query = Task.find(filter)
    .populate('assignedTo', 'name avatar email')
    .populate('createdBy', 'name avatar')
    .populate('project', 'name')
    .populate('commentCount')
    .sort(sortOption);

  // Pagination is opt-in via ?page & ?limit so the existing "return the
  // whole array" behavior (relied on by the current frontend) keeps working
  // when those params are absent.
  if (page || limit) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [tasks, total] = await Promise.all([
      query.skip((pageNum - 1) * pageSize).limit(pageSize),
      Task.countDocuments(filter),
    ]);

    return res.json({
      tasks,
      page: pageNum,
      pages: Math.ceil(total / pageSize) || 1,
      total,
    });
  }

  const tasks = await query;
  res.json(tasks);
});

// @desc    Get single task with comments
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name avatar email')
    .populate('createdBy', 'name avatar')
    .populate('project', 'name owner members');

  if (!task) return res.status(404).json({ message: 'Task not found' });

  // SECURITY: don't let a logged-in user read a task from a project they
  // aren't a member of just by knowing/guessing its id.
  const hasAccess = await assertProjectAccess(task.project, req.user);
  if (!hasAccess) return res.status(403).json({ message: 'You do not have access to this task' });

  const comments = await Comment.find({ task: task._id })
    .populate('user', 'name avatar')
    .sort({ createdAt: 1 });

  res.json({ task, comments });
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = asyncHandler(async (req, res) => {
  const { title, description, project, assignedTo, status, priority, dueDate, checklist } = req.body;

  if (!title || !project) {
    return res.status(400).json({ message: 'Title and project are required' });
  }

  const projectDoc = await Project.findById(project);
  if (!projectDoc) return res.status(404).json({ message: 'Project not found' });

  const task = await Task.create({
    title,
    description,
    project,
    assignedTo: assignedTo || null,
    createdBy: req.user._id,
    status,
    priority,
    dueDate,
    checklist: checklist || [],
  });

  const populated = await task.populate([
    { path: 'assignedTo', select: 'name avatar email' },
    { path: 'createdBy', select: 'name avatar' },
    { path: 'project', select: 'name' },
  ]);

  const io = req.app.get('io');
  if (assignedTo) {
    await notify(io, {
      recipient: assignedTo,
      sender: req.user._id,
      type: 'TASK_ASSIGNED',
      message: `${req.user.name} assigned you the task "${task.title}"`,
      relatedTask: task._id,
      relatedProject: project,
    });
  }

  io?.to(`project:${project}`).emit('task:created', populated);

  res.status(201).json(populated);
});

// @desc    Update task (title, description, priority, dueDate, assignment, checklist)
// @route   PUT /api/tasks/:id
// @access  Private/Admin (members may only update status/checklist on assigned tasks - enforced via updateTaskStatus)
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const hasAccess = await assertProjectAccess(task.project, req.user);
  if (!hasAccess) return res.status(403).json({ message: 'You do not have access to this task' });

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can edit full task details' });
  }

  const { title, description, assignedTo, priority, dueDate, checklist } = req.body;
  const previousAssignee = task.assignedTo ? String(task.assignedTo) : null;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (checklist !== undefined) task.checklist = checklist;

  await task.save();

  const io = req.app.get('io');
  if (assignedTo && assignedTo !== previousAssignee) {
    await notify(io, {
      recipient: assignedTo,
      sender: req.user._id,
      type: 'TASK_ASSIGNED',
      message: `${req.user.name} assigned you the task "${task.title}"`,
      relatedTask: task._id,
      relatedProject: task.project._id,
    });
  }

  const populated = await task.populate([
    { path: 'assignedTo', select: 'name avatar email' },
    { path: 'createdBy', select: 'name avatar' },
  ]);

  io?.to(`project:${task.project._id}`).emit('task:updated', populated);

  res.json(populated);
});

// @desc    Update only task status (used by Kanban drag-and-drop; members can update their own tasks)
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Todo', 'In Progress', 'Completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const hasAccess = await assertProjectAccess(task.project, req.user);
  if (!hasAccess) return res.status(403).json({ message: 'You do not have access to this task' });

  const canEdit =
    req.user.role === 'admin' || String(task.assignedTo) === String(req.user._id);
  if (!canEdit) {
    return res.status(403).json({ message: 'You can only update tasks assigned to you' });
  }

  task.status = status;
  await task.save();

  const populated = await task.populate([
    { path: 'assignedTo', select: 'name avatar email' },
    { path: 'createdBy', select: 'name avatar' },
  ]);

  const io = req.app.get('io');
  io?.to(`project:${task.project._id}`).emit('task:updated', populated);

  if (task.createdBy && String(task.createdBy) !== String(req.user._id)) {
    await notify(io, {
      recipient: task.createdBy,
      sender: req.user._id,
      type: 'TASK_STATUS',
      message: `${req.user.name} moved "${task.title}" to ${status}`,
      relatedTask: task._id,
      relatedProject: task.project._id,
    });
  }

  res.json(populated);
});

// @desc    Toggle a checklist item
// @route   PATCH /api/tasks/:id/checklist/:itemId
// @access  Private
const toggleChecklistItem = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const hasAccess = await assertProjectAccess(task.project, req.user);
  if (!hasAccess) return res.status(403).json({ message: 'You do not have access to this task' });

  const item = task.checklist.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Checklist item not found' });

  item.completed = !item.completed;
  await task.save();

  res.json(task);
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const hasAccess = await assertProjectAccess(task.project, req.user);
  if (!hasAccess) return res.status(403).json({ message: 'You do not have access to this task' });

  await Comment.deleteMany({ task: task._id });
  await task.deleteOne();

  const io = req.app.get('io');
  io?.to(`project:${task.project}`).emit('task:deleted', { _id: task._id, project: task.project });

  res.json({ message: 'Task deleted successfully' });
});

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  toggleChecklistItem,
  deleteTask,
};
