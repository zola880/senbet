const mongoose = require('mongoose');

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,         // optional now
    },
    academicYear: {
      type: String,
      default: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
    },
  },
  { timestamps: true }
);

// Unique index: teacher + course + class, but class can be null
// We'll handle uniqueness carefully – if class is null, only one assignment per teacher+course without class.
teacherAssignmentSchema.index(
  { teacher: 1, course: 1, class: 1 },
  { unique: true, partialFilterExpression: { class: { $type: 'objectId' } } }
);

module.exports = mongoose.model('TeacherAssignment', teacherAssignmentSchema);