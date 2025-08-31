require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Define User Schema (simple version)
    const UserSchema = new mongoose.Schema({
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true }
    }, { timestamps: true });
    
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'jonesdoe@example.com' });
    if (existingUser) {
      console.log('ℹ️  User already exists with this email');
      console.log(`- ID: ${existingUser._id}`);
      console.log(`- Name: ${existingUser.fullName}`);
      console.log(`- Email: ${existingUser.email}`);
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('jones123', 12);
    
    // Create the user
    const newUser = new User({
      fullName: 'Jones Doe',
      email: 'jonesdoe@example.com',
      password: hashedPassword
    });
    
    await newUser.save();
    
    console.log('✅ User created successfully!');
    console.log(`- ID: ${newUser._id}`);
    console.log(`- Name: ${newUser.fullName}`);
    console.log(`- Email: ${newUser.email}`);
    console.log('- Password: jones123 (hashed in database)');
    console.log('\n🎉 You can now login with:');
    console.log('- Email: jonesdoe@example.com');
    console.log('- Password: jones123');
    
  } catch (error) {
    console.error('❌ Failed to create user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createUser().catch(console.error);
