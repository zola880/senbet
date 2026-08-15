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
      unique: true,
      sparse: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^SS-\d{4}$/, 'Student ID must be in format SS-XXXX'],
    },
    adminId: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^AS-\d{4}$/, 'Admin ID must be in format AS-XXXX'],
    },
    teacherId: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^TS-\d{4}$/, 'Teacher ID must be in format TS-XXXX'],
    },
    pinHash: {
      type: String,
      select: false,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
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
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    qualifications: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    academicLevel: {
      type: String,
      default: null,
      trim: true,
    },
    address: {
      type: String,
      enum: ['ላይ ቤሮ', 'ታች ቤሮ', 'ጠቼ', null],
      default: null,
    },
    age: {
      type: Number,
      min: [1, 'Age must be at least 1'],
      max: [120, 'Age must be less than 120'],
      default: null,
    },
    sex: {
      type: String,
      enum: ['Male', 'Female', null],
      default: null,
    },
    fatherName: {
      type: String,
      default: null,
      trim: true,
    },
    hasPin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ studentId: 1 });
userSchema.index({ adminId: 1 });
userSchema.index({ teacherId: 1 });
userSchema.index({ email: 1 });

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  if (this.isModified('pinHash') && this.pinHash) {
    const salt = await bcrypt.genSalt(10);
    this.pinHash = await bcrypt.hash(this.pinHash, salt);
  }
  
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchPin = async function (enteredPin) {
  if (!this.pinHash) return false;
  return await bcrypt.compare(enteredPin, this.pinHash);
};

module.exports = mongoose.model('User', userSchema);