require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function forceCleanOrderSystem() {
  let client;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    
    console.log('Connected to MongoDB');
    console.log('🔥 Force cleaning order system...\n');
    
    // Delete the entire orders collection to start completely fresh
    try {
      await db.collection('orders').drop();
      console.log('✅ Dropped entire orders collection');
    } catch (error) {
      if (error.code === 26) {
        console.log('ℹ️  Orders collection does not exist');
      } else {
        console.log('❌ Error dropping orders collection:', error.message);
      }
    }
    
    // Delete all order-related counters
    const countersCollection = db.collection('counters');
    const orderCounters = await countersCollection.find({ _id: { $regex: /^orderId_/ } }).toArray();
    if (orderCounters.length > 0) {
      const deleteResult = await countersCollection.deleteMany({ _id: { $regex: /^orderId_/ } });
      console.log(`✅ Deleted ${deleteResult.deletedCount} order counters`);
    } else {
      console.log('ℹ️  No order counters found');
    }
    
    // Recreate the orders collection with proper indexes
    const ordersCollection = db.collection('orders');
    
    console.log('\n🔧 Creating fresh order indexes...');
    
    // Create only the compound unique index we want
    await ordersCollection.createIndex(
      { orderId: 1, userId: 1 }, 
      { unique: true, name: 'orderId_userId_unique' }
    );
    console.log('✅ Created compound unique index: orderId_userId_unique');
    
    // Create other necessary indexes
    await ordersCollection.createIndex({ userId: 1 }, { name: 'userId_1' });
    console.log('✅ Created index: userId_1');
    
    await ordersCollection.createIndex({ orderStatus: 1 }, { name: 'orderStatus_1' });
    console.log('✅ Created index: orderStatus_1');
    
    await ordersCollection.createIndex({ createdAt: -1 }, { name: 'createdAt_-1' });
    console.log('✅ Created index: createdAt_-1');
    
    // Verify the indexes
    console.log('\n📊 Final order collection indexes:');
    const finalIndexes = await ordersCollection.listIndexes().toArray();
    finalIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });
    
    // Verify no orderId_1 index exists
    const hasOrderIdIndex = finalIndexes.some(index => index.name === 'orderId_1');
    if (hasOrderIdIndex) {
      console.log('❌ WARNING: orderId_1 index still exists!');
    } else {
      console.log('✅ Confirmed: No orderId_1 index exists');
    }
    
    console.log('\n🎉 Order system completely reset and ready!');
    console.log('- All orders deleted');
    console.log('- All order counters deleted');
    console.log('- Fresh collection with proper compound unique index');
    console.log('- No global orderId_1 index');
    console.log('- New orders will start from ORD00001 for each user');
    
  } catch (error) {
    console.error('❌ Force clean failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the force clean
forceCleanOrderSystem().catch(console.error);
