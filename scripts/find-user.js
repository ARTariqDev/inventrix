const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  fullName: String,
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function findUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({}).limit(10);
    console.log('\n📋 Users found:');
    users.forEach(user => {
      console.log(`   Email: ${user.email}, Name: ${user.fullName}, ID: ${user._id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findUsers();
