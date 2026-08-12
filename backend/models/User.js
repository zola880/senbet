const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: function() {
        // Email is required for admin and teacher, but optional for student
        return this.role !== 'student';
      },
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true, // Only enforced for non-null values
      match: [/^SS-\d{4}$/, 'Student ID must be in format SS-XXXX (e.g., SS-0001)'],
    },
    pinHash: {
      type: String,
      select: false, // Don't include pinHash in queries by default
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // don't return password by default
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student', 'development'],
      required: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    // Student-specific fields
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    rollNumber: {
      type: String,
      default: null,
    },
    phone: String, // Parent/Guardian phone
    // Teacher-specific fields (optional)
    qualifications: String,
    profileImage: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster student login lookup
userSchema.index({ studentId: 1 });

// Hash PIN before saving if modified
userSchema.pre('save', async function (next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Hash PIN if modified (for students)
  if (this.isModified('pinHash')) {
    const salt = await bcrypt.genSalt(10);
    this.pinHash = await bcrypt.hash(this.pinHash, salt);
  }
  
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare entered PIN with hashed PIN
userSchema.methods.matchPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.pinHash);
};

// Helper to check if user is a student
userSchema.methods.isStudent = function () {
  return this.role === 'student';
};

// Helper to check if user account is active
userSchema.methods.isActive = function () {
  return this.accountStatus === 'active';
};

module.exports = mongoose.model('User', userSchema);