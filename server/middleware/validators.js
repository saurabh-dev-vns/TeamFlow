const { body, validationResult } = require('express-validator');

// Runs after any *Rules array below; collects express-validator's errors
// into the same { message } shape the rest of the API already uses.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const createTaskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 }),
  body('project').notEmpty().withMessage('Project is required').isMongoId().withMessage('Invalid project id'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Completed']),
  body('priority').optional().isIn(['Low', 'Medium', 'High']),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be a valid date'),
  body('assignedTo').optional({ nullable: true }).isMongoId().withMessage('Invalid assignee id'),
];

const createProjectRules = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 150 }),
  body('status').optional().isIn(['Planning', 'In Progress', 'Completed', 'On Hold']),
  body('deadline').optional({ nullable: true }).isISO8601().withMessage('deadline must be a valid date'),
  body('members').optional().isArray().withMessage('members must be an array of user ids'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  createTaskRules,
  createProjectRules,
};
