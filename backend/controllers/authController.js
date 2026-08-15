const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { jwtSecret, jwtExpire } = require('../config/env');
const crypto = require('crypto');

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpire });
};

const generatePin = () => {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1000000;
  return String(num).padStart(6, '0');
};

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
};

const getNextId = async (prefix, fieldName) => {
  const users = await User.find(
    { [fieldName]: { $ne: null } },
    { [fieldName]: 1 }
  ).lean();

  let maxNumber = 0;
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  
  users.forEach((user) => {
    const match = user[fieldName].match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });

  return `${prefix}-${String(maxNumber + 1).padStart(4, '0')}`;
};

const register = async (req, res, next) => {
  try {
    const { fullName, role, class: classId, qualifications, phone } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    const maxAttempts = 5;
    let lastError = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        let userId = null;
        let fieldName = null;
        let generatedPassword = generatePassword();

        if (role === 'admin' || role === 'development') {
          userId = await getNextId('AS', 'adminId');
          fieldName = 'adminId';
        } else if (role === 'teacher') {
          userId = await getNextId('TS', 'teacherId');
          fieldName = 'teacherId';
        }

        console.log(`Attempt ${attempt + 1}: Creating ${role} ${fullName} with ID ${userId}`);

        const userData = {
          fullName: fullName.trim(),
          role,
          password: generatedPassword,
          qualifications: qualifications || null,
          phone: phone || null,
          accountStatus: 'active',
        };

        if (fieldName === 'adminId') {
          userData.adminId = userId;
        } else if (fieldName === 'teacherId') {
          userData.teacherId = userId;
        }

        const user = await User.create(userData);

        user.password = undefined;

        console.log('SUCCESS: User created:', userId);

        return res.status(201).json({
          success: true,
          data: {
            userId,
            fullName: user.fullName,
            role: user.role,
            createdPassword: generatedPassword,
          },
          token: generateToken(user._id),
        });
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);

        if (error.code === 11000) {
          console.warn(`Duplicate key error on attempt ${attempt + 1}. Retrying...`);
          lastError = error;
          continue;
        }

        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map((err) => err.message);
          return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        throw error;
      }
    }

    console.error('Failed to create user after multiple attempts:', lastError);
    return res.status(500).json({
      success: false,
      message: 'Could not generate a unique ID. Please try again.',
    });
  } catch (error) {
    console.error('Register error:', error);
    next(error);
  }
};

const registerStudent = async (req, res, next) => {
  try {
    const {
      fullName,
      class: classId,
      phone,
      academicLevel,
      address,
      age,
      sex,
      fatherName,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class selected' });
    }

    const maxAttempts = 5;
    let lastError = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const studentId = await getNextId('SS', 'studentId');
        const newPin = generatePin();

        console.log(`Attempt ${attempt + 1}: Creating student ${fullName} with ID ${studentId}`);

        const user = await User.create({
          fullName: fullName.trim(),
          studentId,
          pinHash: newPin,
          role: 'student',
          class: classId,
          phone: phone || null,
          accountStatus: 'active',
          academicLevel: academicLevel || null,
          address: address || null,
          age: age ? Number(age) : null,
          sex: sex || null,
          fatherName: fatherName || null,
          hasPin: true,
        });

        user.password = undefined;
        user.pinHash = undefined;

        console.log('SUCCESS: Student created:', user.studentId);

        return res.status(201).json({
          success: true,
          data: {
            studentId: user.studentId,
            fullName: user.fullName,
            class: user.class,
            phone: user.phone,
            role: user.role,
            createdPin: newPin,
          },
          token: generateToken(user._id),
        });
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);

        if (error.code === 11000) {
          console.warn(`Duplicate key error on attempt ${attempt + 1}. Retrying...`);
          lastError = error;
          continue;
        }

        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map((err) => err.message);
          return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        throw error;
      }
    }

    console.error('Failed to create student after multiple attempts:', lastError);
    return res.status(500).json({
      success: false,
      message: 'Could not generate a unique Student ID. Please try again.',
    });
  } catch (error) {
    console.error('=== REGISTER STUDENT ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    next(error);
  }
};

const generateStudentPin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+pinHash');
    if (!user) return res.status(404).json({ success: false, message: 'Student not found' });
    if (user.role !== 'student') return res.status(400).json({ success: false, message: 'User is not a student' });

    const newPin = generatePin();
    user.pinHash = newPin;
    user.hasPin = true;
    await user.save();

    user.password = undefined;
    user.pinHash = undefined;

    res.status(200).json({
      success: true,
      data: { studentId: user.studentId, fullName: user.fullName, createdPin: newPin },
    });
  } catch (error) {
    console.error('GenerateStudentPin error:', error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    
    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide User ID and password' });
    }

    let user = null;
    let query = {};

    if (userId.startsWith('AS-')) {
      query.adminId = userId;
    } else if (userId.startsWith('TS-')) {
      query.teacherId = userId;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid User ID format' });
    }

    user = await User.findOne(query).select('+password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid User ID or password' });
    }

    if (user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Students must use Student ID and PIN to login' });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid User ID or password' });
    }

    user.password = undefined;

    res.status(200).json({ success: true, data: user, token: generateToken(user._id) });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

const studentLogin = async (req, res, next) => {
  try {
    const { studentId, pin } = req.body;
    if (!studentId || !pin) return res.status(400).json({ success: false, message: 'Please provide Student ID and PIN' });

    const user = await User.findOne({ studentId }).select('+pinHash');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid Student ID or PIN' });
    if (user.role !== 'student') return res.status(403).json({ success: false, message: 'This login is for students only' });
    if (user.accountStatus !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });
    if (!user.pinHash) return res.status(401).json({ success: false, message: 'PIN not set. Please contact administrator.' });

    const isMatch = await user.matchPin(pin);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid Student ID or PIN' });

    user.password = undefined;
    user.pinHash = undefined;

    res.status(200).json({ success: true, data: user, token: generateToken(user._id) });
  } catch (error) {
    console.error('StudentLogin error:', error);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('class', 'name').lean();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe error:', error);
    next(error);
  }
};

module.exports = {
  register,
  registerStudent,
  generateStudentPin,
  login,
  studentLogin,
  getMe,
};