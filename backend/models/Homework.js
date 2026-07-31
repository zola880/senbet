const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  attachments: [String], // file paths
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);