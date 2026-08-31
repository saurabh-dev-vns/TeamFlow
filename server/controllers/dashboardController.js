const asyncHandler = require('../middleware/asyncHandler');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get dashboard summary stats + chart data, scoped to the user's visible projects
// @route   GET /api/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';

  const projectFilter = isAdmin
    ? {}
    : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

  const projects = await Project.find(projectFilter);
  const projectIds = projects.map((p) => p._id);

  const taskFilter = isAdmin ? {} : { project: { $in: projectIds } };
  const tasks = await Task.find(taskFilter);

  const now = new Date();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed'
  ).length;

  const teamMemberIds = new Set();
  projects.forEach((p) => {
    teamMemberIds.add(String(p.owner));
    p.members.forEach((m) => teamMemberIds.add(String(m)));
  });

  const tasksByStatus = [
    { name: 'Todo', value: tasks.filter((t) => t.status === 'Todo').length },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'In Progress').length },
    { name: 'Completed', value: tasks.filter((t) => t.status === 'Completed').length },
  ];

  const tasksByPriority = [
    { name: 'Low', value: tasks.filter((t) => t.priority === 'Low').length },
    { name: 'Medium', value: tasks.filter((t) => t.priority === 'Medium').length },
    { name: 'High', value: tasks.filter((t) => t.priority === 'High').length },
  ];

  const projectProgress = projects.map((project) => {
    const projectTasks = tasks.filter((t) => String(t.project) === String(project._id));
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === 'Completed').length;
    return {
      name: project.name,
      progress: total ? Math.round((completed / total) * 100) : 0,
    };
  });

  res.json({
    stats: {
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      teamMembers: teamMemberIds.size,
    },
    charts: {
      tasksByStatus,
      tasksByPriority,
      projectProgress,
    },
  });
});

module.exports = { getDashboard };
