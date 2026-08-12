const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const run = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('ERROR: MONGO_URI or MONGODB_URI not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected successfully');

  console.log('Backfilling accountStatus for old users...');
  const result = await User.updateMany(
    { accountStatus: { $exists: false } },
    { $set: { accountStatus: 'active' } }
  );

  console.log(`✓ Repaired ${result.modifiedCount} users`);
  console.log(`✓ ${result.matchedCount} users matched the query`);
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

run().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});