const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Project name is required'], trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
      default: 'Planning',
    },
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
