const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Most Next.js apps use bcryptjs
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  fullName: String,
  password: String,
}, { collection: 'users' });

// Add the hash method like in the actual model
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function fixPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let user = await User.findOne({ email: 'artariqdev@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found. Creating new user...');
      user = new User({
        email: 'artariqdev@gmail.com',
        fullName: 'Test User',
        password: 'test123', // Will be hashed by pre-save hook
        isActive: true
      });
    } else {
      // Update existing user password
      user.password = 'test123'; // Will be hashed by pre-save hook
    }
    
    await user.save();

    console.log('✅ User saved with password!');
    console.log('\n📧 Login credentials:');
    console.log('   Email: artariqdev@gmail.com');
    console.log('   Password: test123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixPassword();
