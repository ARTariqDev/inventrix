require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function fixOrderSystem() {
  let client;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    const countersCollection = db.collection('counters');
    
    console.log('🔧 Fixing Order ID System...\n');
    
    // 1. Check current state
    console.log('1. Current state:');
    const orderCount = await ordersCollection.countDocuments();
    console.log(`   - Total orders: ${orderCount}`);
    
    const indexes = await ordersCollection.listIndexes().toArray();
    console.log('   - Current indexes:');
    indexes.forEach(index => {
      console.log(`     • ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });
    
    // 2. Drop any old indexes that might conflict
    console.log('\n2. Cleaning up indexes:');
    try {
      await ordersCollection.dropIndex('orderId_1');
      console.log('   ✅ Dropped old orderId_1 index');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('   ✅ orderId_1 index already removed');
      } else {
        console.log(`   ❌ Error dropping orderId_1: ${error.message}`);
      }
    }
    
    // 3. Ensure compound unique index exists
    console.log('\n3. Setting up correct indexes:');
    try {
      await ordersCollection.createIndex(
        { orderId: 1, userId: 1 }, 
        { unique: true, name: 'orderId_userId_unique' }
      );
      console.log('   ✅ Compound unique index on orderId + userId created');
    } catch (error) {
      if (error.code === 85) { // Index already exists
        console.log('   ✅ Compound unique index already exists');
      } else {
        console.log(`   ❌ Error creating compound index: ${error.message}`);
      }
    }
    
    // 4. Clean up any global order counters
    console.log('\n4. Cleaning up global counters:');
    const deletedGlobal = await countersCollection.deleteMany({ 
      _id: { $in: ['orderId', 'OrderId', 'order_id'] } 
    });
    console.log(`   ✅ Removed ${deletedGlobal.deletedCount} global order counters`);
    
    // 5. Check user-specific counters
    console.log('\n5. User-specific order counters:');
    const orderCounters = await countersCollection.find({ 
      _id: { $regex: /^orderId_/ } 
    }).toArray();
    
    if (orderCounters.length === 0) {
      console.log('   ✅ No user-specific order counters (will be created on first order)');
    } else {
      console.log(`   Found ${orderCounters.length} user-specific order counters:`);
      orderCounters.forEach(counter => {
        console.log(`     • ${counter._id}: ${counter.sequence_value}`);
      });
    }
    
    // 6. Final verification
    console.log('\n6. Final verification:');
    const finalIndexes = await ordersCollection.listIndexes().toArray();
    const hasCompoundIndex = finalIndexes.some(idx => 
      idx.name === 'orderId_userId_unique' && idx.unique
    );
    const hasOldIndex = finalIndexes.some(idx => idx.name === 'orderId_1');
    
    console.log(`   ✅ Compound unique index exists: ${hasCompoundIndex}`);
    console.log(`   ✅ Old global index removed: ${!hasOldIndex}`);
    
    if (hasCompoundIndex && !hasOldIndex) {
      console.log('\n🎉 Order system is ready!');
      console.log('   - New users will start with ORD00001');
      console.log('   - Each user has independent order numbering');
      console.log('   - No more duplicate key errors');
    } else {
      console.log('\n❌ Order system needs manual attention');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n📡 Disconnected from MongoDB');
    }
  }
}

// Run the fix
fixOrderSystem().catch(console.error);
