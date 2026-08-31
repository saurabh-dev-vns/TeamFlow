// Seed script: wipes existing data and creates demo users, projects, and tasks
// so the app can be explored immediately after setup.
//
// Run with: npm run seed  (from the /server directory)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

const run = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('Creating demo users...');
  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@teamflow.com',
    password: 'Admin@123',
    role: 'admin',
  });

  const member1 = await User.create({
    name: 'Rahul Sharma',
    email: 'member@teamflow.com',
    password: 'Member@123',
    role: 'member',
  });

  const member2 = await User.create({
    name: 'Priya Patel',
    email: 'priya@teamflow.com',
    password: 'Member@123',
    role: 'member',
  });

  const member3 = await User.create({
    name: 'Sam Lee',
    email: 'sam@teamflow.com',
    password: 'Member@123',
    role: 'member',
  });

  console.log('Creating demo projects...');
  const website = await Project.create({
    name: 'Company Website Redesign',
    description: 'Revamp the marketing website with a new design system and faster load times.',
    status: 'In Progress',
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    owner: admin._id,
    members: [member1._id, member2._id],
  });

  const mobileApp = await Project.create({
    name: 'Mobile App Launch',
    description: 'Build and ship v1.0 of the TeamFlow companion mobile app.',
    status: 'Planning',
    startDate: new Date(),
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    owner: admin._id,
    members: [member2._id, member3._id],
  });

  const marketing = await Project.create({
    name: 'Q3 Marketing Campaign',
    description: 'Plan and execute the Q3 product marketing campaign across channels.',
    status: 'Completed',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    owner: admin._id,
    members: [member1._id, member3._id],
  });

  console.log('Creating demo tasks...');
  const taskDefs = [
    { title: 'Design new homepage hero section', project: website, assignedTo: member1, status: 'In Progress', priority: 'High', dueDays: 5 },
    { title: 'Set up component library in Storybook', project: website, assignedTo: member2, status: 'Todo', priority: 'Medium', dueDays: 10 },
    { title: 'Optimize image loading pipeline', project: website, assignedTo: member1, status: 'Completed', priority: 'Medium', dueDays: -2 },
    { title: 'Write API integration tests', project: website, assignedTo: member2, status: 'Todo', priority: 'Low', dueDays: 14 },
    { title: 'Fix mobile nav overflow bug', project: website, assignedTo: member1, status: 'In Progress', priority: 'High', dueDays: -1 },

    { title: 'Wireframe onboarding flow', project: mobileApp, assignedTo: member2, status: 'Todo', priority: 'High', dueDays: 7 },
    { title: 'Set up React Native project scaffold', project: mobileApp, assignedTo: member3, status: 'In Progress', priority: 'Medium', dueDays: 3 },
    { title: 'Define push notification strategy', project: mobileApp, assignedTo: member3, status: 'Todo', priority: 'Low', dueDays: 21 },

    { title: 'Draft campaign messaging brief', project: marketing, assignedTo: member1, status: 'Completed', priority: 'High', dueDays: -30 },
    { title: 'Schedule social media calendar', project: marketing, assignedTo: member3, status: 'Completed', priority: 'Medium', dueDays: -20 },
    { title: 'Compile campaign performance report', project: marketing, assignedTo: member1, status: 'Completed', priority: 'Medium', dueDays: -10 },
  ];

  const tasks = [];
  for (const def of taskDefs) {
    const task = await Task.create({
      title: def.title,
      description: `${def.title} — part of ${def.project.name}.`,
      project: def.project._id,
      assignedTo: def.assignedTo._id,
      createdBy: admin._id,
      status: def.status,
      priority: def.priority,
      dueDate: new Date(Date.now() + def.dueDays * 24 * 60 * 60 * 1000),
      checklist: [
        { text: 'Research / plan approach', completed: def.status !== 'Todo' },
        { text: 'Implement', completed: def.status === 'Completed' },
        { text: 'Review with team', completed: def.status === 'Completed' },
      ],
    });
    tasks.push(task);
  }

  console.log('Creating demo comments...');
  await Comment.create({
    user: member1._id,
    task: tasks[0]._id,
    text: 'Started on the initial mockups, will share a Figma link soon.',
  });
  await Comment.create({
    user: admin._id,
    task: tasks[0]._id,
    text: 'Sounds great, looking forward to it!',
  });
  await Comment.create({
    user: member3._id,
    task: tasks[6]._id,
    text: 'Scaffold is up and running on both iOS and Android simulators.',
  });

  console.log('Creating demo notifications...');
  await Notification.create({
    recipient: member1._id,
    sender: admin._id,
    type: 'TASK_ASSIGNED',
    message: `Alex Admin assigned you the task "${tasks[0].title}"`,
    relatedTask: tasks[0]._id,
    relatedProject: website._id,
    isRead: false,
  });
  await Notification.create({
    recipient: member1._id,
    sender: admin._id,
    type: 'MEMBER_ADDED',
    message: 'Alex Admin added you to project "Company Website Redesign"',
    relatedProject: website._id,
    isRead: true,
  });

  console.log('\nSeed complete!');
  console.log('----------------------------------------');
  console.log('Demo credentials (development only — change before production):');
  console.log('  Admin:  admin@teamflow.com / Admin@123');
  console.log('  Member: member@teamflow.com / Member@123');
  console.log('----------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
