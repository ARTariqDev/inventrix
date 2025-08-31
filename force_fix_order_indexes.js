require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function forceRecreateOrderIndexes() {
  let client;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    
    console.log('Connected to MongoDB');
    
    // List all existing indexes
    console.log('\nExisting indexes on orders collection:');
    const existingIndexes = await ordersCollection.listIndexes().toArray();
    existingIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });
    
    // Drop ALL indexes except _id (which can't be dropped)
    const indexesToDrop = existingIndexes
      .filter(index => index.name !== '_id_')
      .map(index => index.name);
    
    for (const indexName of indexesToDrop) {
      try {
        await ordersCollection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`❌ Failed to drop index ${indexName}:`, error.message);
      }
    }
    
    // Recreate only the indexes we want
    console.log('\nRecreating desired indexes...');
    
    // Compound unique index for orderId + userId
    await ordersCollection.createIndex(
      { orderId: 1, userId: 1 }, 
      { unique: true, name: 'orderId_userId_unique' }
    );
    console.log('✅ Created compound unique index: orderId_userId_unique');
    
    // Other necessary indexes
    await ordersCollection.createIndex({ userId: 1 }, { name: 'userId_1' });
    console.log('✅ Created index: userId_1');
    
    await ordersCollection.createIndex({ orderStatus: 1 }, { name: 'orderStatus_1' });
    console.log('✅ Created index: orderStatus_1');
    
    await ordersCollection.createIndex({ createdAt: -1 }, { name: 'createdAt_-1' });
    console.log('✅ Created index: createdAt_-1');
    
    // List final indexes
    console.log('\nFinal indexes on orders collection:');
    const finalIndexes = await ordersCollection.listIndexes().toArray();
    finalIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });
    
    // Also clean up any existing order documents (since this is development)
    const orderCount = await ordersCollection.countDocuments();
    if (orderCount > 0) {
      console.log(`\nFound ${orderCount} existing orders. Removing them to start fresh...`);
      const deleteResult = await ordersCollection.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} orders`);
    }
    
    // Clean up order counters to start fresh
    const countersCollection = db.collection('counters');
    const orderCounters = await countersCollection.find({ _id: { $regex: /^orderId_/ } }).toArray();
    if (orderCounters.length > 0) {
      console.log(`\nFound ${orderCounters.length} order counters. Removing them to start fresh...`);
      const deleteResult = await countersCollection.deleteMany({ _id: { $regex: /^orderId_/ } });
      console.log(`✅ Deleted ${deleteResult.deletedCount} order counters`);
    }
    
  } catch (error) {
    console.error('Operation failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the operation
forceRecreateOrderIndexes().catch(console.error);
