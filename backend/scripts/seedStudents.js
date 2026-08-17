const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const User = require('../models/User');
const Counter = require('../models/Counter');
const Class = require('../models/Class');

// Generate 6-digit PIN
const generatePin = () => {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1000000;
  return String(num).padStart(6, '0');
};

const run = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ ERROR: MONGO_URI not set in .env');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected successfully\n');

  // Get class ID from command line argument or use first available
  let classArg = process.argv[2];
  let targetClass = null;

  if (classArg) {
    targetClass = await Class.findById(classArg);
    if (!targetClass) {
      console.error(`❌ Class with ID ${classArg} not found`);
      await mongoose.disconnect();
      process.exit(1);
    }
  } else {
    targetClass = await Class.findOne().lean();
    if (!targetClass) {
      console.error('❌ No classes found in database. Create a class first!');
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log(`ℹ️  No class ID provided. Using first available class: ${targetClass.name}`);
  }

  console.log(`📚 Assigning all students to class: ${targetClass.name}\n`);

  // Read the Excel file
  const excelPath = path.join(__dirname, 'የወንዶ_ስም_ዝርዝር.xlsx');
  console.log(`📖 Reading Excel file: ${excelPath}`);

  let workbook;
  try {
    workbook = XLSX.readFile(excelPath);
  } catch (err) {
    console.error(`❌ Failed to read Excel file: ${err.message}`);
    console.log('   Make sure the file is in the scripts/ folder with the exact name: የወንዶ_ስም_ዝርዝር.xlsx');
    await mongoose.disconnect();
    process.exit(1);
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`📋 Found ${rows.length} rows in the sheet\n`);

  // Skip header row, parse students
  const students = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1]) continue; // Skip empty rows

    const student = {
      fullName: String(row[1] || '').trim(),
      sex: row[2] === 'ወ' ? 'Male' : 'Female',
      age: row[3] ? Number(row[3]) : null,
      academicLevel: row[4] ? String(row[4]) : null,
      fatherName: row[5] ? String(row[5]).trim() : null,
      phone: row[6] ? String(row[6]).trim() : null,
    };

    if (student.fullName) {
      students.push(student);
    }
  }

  console.log(`👥 Parsed ${students.length} valid students from Excel\n`);

  if (students.length === 0) {
    console.log('⚠️  No students to seed. Exiting.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Reset the counter to the current highest student ID
  const existingStudents = await User.find(
    { studentId: { $ne: null } },
    { studentId: 1 }
  ).lean();

  let maxNumber = 0;
  existingStudents.forEach(s => {
    const match = s.studentId.match(/^SS-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });

  await Counter.findByIdAndUpdate(
    'studentId',
    { seq: maxNumber },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`🔢 Counter synced. Highest existing ID: SS-${String(maxNumber).padStart(4, '0')}`);
  console.log(`📝 Will create ${students.length} new students starting from SS-${String(maxNumber + 1).padStart(4, '0')}\n`);
  console.log('═══════════════════════════════════════════════════════════');

  const createdStudents = [];
  const failedStudents = [];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];

    try {
      // Get next ID from counter
      const counter = await Counter.findByIdAndUpdate(
        'studentId',
        { $inc: { seq: 1 } },
        { new: true }
      );
      const studentId = `SS-${String(counter.seq).padStart(4, '0')}`;
      const pin = generatePin();

      const user = await User.create({
        fullName: s.fullName,
        studentId,
        pinHash: pin,
        role: 'student',
        class: targetClass._id,
        phone: s.phone || null,
        accountStatus: 'active',
        academicLevel: s.academicLevel || null,
        address: null,
        age: s.age || null,
        sex: s.sex || 'Male',
        fatherName: s.fatherName || null,
        hasPin: true,
      });

      createdStudents.push({
        studentId: user.studentId,
        fullName: user.fullName,
        fatherName: user.fatherName,
        academicLevel: user.academicLevel,
        age: user.age,
        phone: user.phone,
        pin: pin,
      });

      console.log(`✅ [${i + 1}/${students.length}] ${user.studentId} - ${user.fullName}`);
    } catch (err) {
      console.error(`❌ [${i + 1}/${students.length}] FAILED for ${s.fullName}:`, err.message);
      failedStudents.push({ name: s.fullName, error: err.message });
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ SUCCESSFULLY CREATED: ${createdStudents.length} students`);
  console.log(`❌ FAILED: ${failedStudents.length} students`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (createdStudents.length > 0) {
    console.log('📄 COMPLETE CREDENTIALS LIST:\n');
    console.log('No.   | Student ID | Full Name                   | Father Name           | Grade | PIN');
    console.log('------|------------|-----------------------------|-----------------------|-------|-------');
    createdStudents.forEach((s, idx) => {
      console.log(
        `${String(idx + 1).padStart(3)}.   | ${s.studentId} | ${s.fullName.padEnd(27)} | ${(s.fatherName || '—').padEnd(21)} | ${(s.academicLevel || '—').padEnd(5)} | ${s.pin}`
      );
    });
    console.log('\n⚠️  SAVE THESE PINS! They will not be shown again.');
    console.log('💡 TIP: You can reset any PIN later from the Manage Users page.');
  }

  if (failedStudents.length > 0) {
    console.log('\n❌ Failed students:');
    failedStudents.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
  }

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});