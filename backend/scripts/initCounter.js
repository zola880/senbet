const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Counter = require('../models/Counter');

const run = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('ERROR: MONGO_URI not set');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected successfully');

  // Find the highest existing student ID
  const allStudents = await User.find(
    { studentId: { $ne: null } },
    { studentId: 1 }
  ).lean();

  let maxNumber = 0;
  allStudents.forEach(student => {
    const match = student.studentId.match(/^SS-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });

  console.log(`Found ${allStudents.length} existing students`);
  console.log(`Highest existing student ID number: ${maxNumber}`);

  // Initialize counter to highest existing number
  await Counter.findByIdAndUpdate(
    'studentId',
    { seq: maxNumber },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`✓ Counter initialized to ${maxNumber}`);
  console.log(`✓ Next student will get ID: SS-${String(maxNumber + 1).padStart(4, '0')}`);

  await mongoose.disconnect();
  console.log('Done!');
  process.exit(0);
};

run().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});