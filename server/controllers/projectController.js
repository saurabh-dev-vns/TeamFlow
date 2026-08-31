const asyncHandler = require('../middleware/asyncHandler');
const Project = require('../models/Project');
const Task = require('../models/Task');
const notify = require('../utils/notify');

// @desc    Get all projects visible to the current user
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'admin'
      ? {}
      : { $or: [{ members: req.user._id }, { owner: req.user._id }] };

  const projects = await Project.find(filter)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar role')
    .sort({ createdAt: -1 });

  // Attach lightweight task stats for each project so the list view can show progress.
  const projectIds = projects.map((p) => p._id);
  const tasks = await Task.find({ project: { $in: projectIds } }).select('project status');

  const withStats = projects.map((project) => {
    const projectTasks = tasks.filter((t) => String(t.project) === String(project._id));
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === 'Completed').length;
    return {
      ...project.toObject(),
      taskStats: {
        total,
        completed,
        pending: total - completed,
        progress: total ? Math.round((completed / total) * 100) : 0,
      },
    };
  });

  res.json(withStats);
});

// @desc    Get a single project with full detail (stats, members, recent activity)
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar role');

  if (!project) return res.status(404).json({ message: 'Project not found' });

  const isMember =
    req.user.role === 'admin' ||
    String(project.owner._id) === String(req.user._id) ||
    project.members.some((m) => String(m._id) === String(req.user._id));

  if (!isMember) {
    return res.status(403).json({ message: 'You do not have access to this project' });
  }

  const tasks = await Task.find({ project: project._id })
    .populate('assignedTo', 'name avatar email')
    .populate('createdBy', 'name avatar')
    .sort({ createdAt: -1 });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const pending = total - completed;

  res.json({
    project,
    tasks,
    stats: {
      total,
      completed,
      pending,
      progress: total ? Math.round((completed / total) * 100) : 0,
    },
  });
});

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, startDate, deadline, members } = req.body;

  if (!name) return res.status(400).json({ message: 'Project name is required' });

  const project = await Project.create({
    name,
    description,
    status,
    startDate,
    deadline,
    owner: req.user._id,
    members: members || [],
  });

  const populated = await project.populate([
    { path: 'owner', select: 'name email avatar' },
    { path: 'members', select: 'name email avatar role' },
  ]);

  const io = req.app.get('io');
  for (const memberId of members || []) {
    await notify(io, {
      recipient: memberId,
      sender: req.user._id,
      type: 'MEMBER_ADDED',
      message: `${req.user.name} added you to project "${project.name}"`,
      relatedProject: project._id,
    });
  }

  res.status(201).json(populated);
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const { name, description, status, startDate, deadline } = req.body;

  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (status !== undefined) project.status = status;
  if (startDate !== undefined) project.startDate = startDate;
  if (deadline !== undefined) project.deadline = deadline;

  await project.save();

  const populated = await project.populate([
    { path: 'owner', select: 'name email avatar' },
    { path: 'members', select: 'name email avatar role' },
  ]);

  res.json(populated);
});

// @desc    Delete a project (and its tasks)
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ message: 'Project deleted successfully' });
});

// @desc    Add a member to a project
// @route   POST /api/projects/:id/members
// @access  Private/Admin
const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  if (project.members.some((m) => String(m) === String(userId))) {
    return res.status(400).json({ message: 'User is already a member of this project' });
  }

  project.members.push(userId);
  await project.save();

  const io = req.app.get('io');
  await notify(io, {
    recipient: userId,
    sender: req.user._id,
    type: 'MEMBER_ADDED',
    message: `${req.user.name} added you to project "${project.name}"`,
    relatedProject: project._id,
  });

  const populated = await project.populate([
    { path: 'owner', select: 'name email avatar' },
    { path: 'members', select: 'name email avatar role' },
  ]);

  res.json(populated);
});

// @desc    Remove a member from a project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private/Admin
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  project.members = project.members.filter((m) => String(m) !== String(req.params.userId));
  await project.save();

  const populated = await project.populate([
    { path: 'owner', select: 'name email avatar' },
    { path: 'members', select: 'name email avatar role' },
  ]);

  res.json(populated);
});

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
