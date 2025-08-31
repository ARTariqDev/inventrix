require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function resetUserCounter() {
  let client;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    
    console.log('Connected to MongoDB');
    console.log('🔍 Looking for user: jonesdoe@example.com\n');
    
    // Find the user by email
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: 'jonesdoe@example.com' });
    
    if (!user) {
      console.log('❌ User not found with email: jonesdoe@example.com');
      return;
    }
    
    console.log('✅ Found user:');
    console.log(`- ID: ${user._id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.fullName || 'N/A'}`);
    
    const userId = user._id.toString();
    
    // Check for existing order counter
    const countersCollection = db.collection('counters');
    const orderCounterKey = `orderId_${userId}`;
    
    const existingCounter = await countersCollection.findOne({ _id: orderCounterKey });
    
    if (existingCounter) {
      console.log(`\n📊 Current order counter for user: ${existingCounter.sequence_value}`);
      
      // Reset the counter to 0
      await countersCollection.updateOne(
        { _id: orderCounterKey },
        { $set: { sequence_value: 0 } }
      );
      console.log('✅ Reset order counter to 0');
    } else {
      console.log('\nℹ️  No order counter found for this user (will start from 0)');
    }
    
    // Check for existing orders
    const ordersCollection = db.collection('orders');
    const userOrders = await ordersCollection.find({ userId: user._id }).toArray();
    
    if (userOrders.length > 0) {
      console.log(`\n📋 Found ${userOrders.length} existing orders for this user:`);
      userOrders.forEach(order => {
        console.log(`- ${order.orderId} (${order.orderStatus}) - ${new Date(order.createdAt).toLocaleString()}`);
      });
      
      // Optionally delete existing orders
      console.log('\n🗑️  Deleting existing orders to start fresh...');
      const deleteResult = await ordersCollection.deleteMany({ userId: user._id });
      console.log(`✅ Deleted ${deleteResult.deletedCount} orders`);
    } else {
      console.log('\nℹ️  No existing orders found for this user');
    }
    
    // Verify final state
    const finalCounter = await countersCollection.findOne({ _id: orderCounterKey });
    const finalOrderCount = await ordersCollection.countDocuments({ userId: user._id });
    
    console.log('\n🎉 Reset complete!');
    console.log(`- Order counter: ${finalCounter ? finalCounter.sequence_value : 0}`);
    console.log(`- Existing orders: ${finalOrderCount}`);
    console.log('- Next order will be: ORD00001');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the reset
resetUserCounter().catch(console.error);
