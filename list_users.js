require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function listAllUsers() {
  let client;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    
    console.log('Connected to MongoDB');
    console.log('📋 Listing all users in the database:\n');
    
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    if (users.length === 0) {
      console.log('ℹ️  No users found in the database');
    } else {
      console.log(`Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.fullName || 'N/A'}`);
        console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}`);
        console.log('');
      });
    }
    
    // Also check counters to see which users have order counters
    const countersCollection = db.collection('counters');
    const orderCounters = await countersCollection.find({ _id: { $regex: /^orderId_/ } }).toArray();
    
    if (orderCounters.length > 0) {
      console.log('📊 Existing order counters:');
      orderCounters.forEach(counter => {
        const userId = counter._id.replace('orderId_', '');
        console.log(`- User ID: ${userId}, Counter: ${counter.sequence_value}`);
      });
    } else {
      console.log('ℹ️  No order counters found');
    }
    
  } catch (error) {
    console.error('❌ Failed to list users:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the listing
listAllUsers().catch(console.error);
