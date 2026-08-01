const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

   const admin = await User.create({
  fullName: 'zelalem',                         // ← your name
  email: 'zelalemybabe77@gmail.com',           // ← your email
  password: '131019',                          // ← your chosen password
  role: 'admin',
});

    console.log('Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Use the password you set to login.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();