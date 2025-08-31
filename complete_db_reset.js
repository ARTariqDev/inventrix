require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function completeDbReset() {
  let client;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    
    console.log('Connected to MongoDB');
    console.log('🧹 Starting complete database cleanup...\n');
    
    // Delete all users
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    if (userCount > 0) {
      const deleteResult = await usersCollection.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} users`);
    } else {
      console.log('ℹ️  No users found');
    }
    
    // Delete all products
    const productsCollection = db.collection('products');
    const productCount = await productsCollection.countDocuments();
    if (productCount > 0) {
      const deleteResult = await productsCollection.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} products`);
    } else {
      console.log('ℹ️  No products found');
    }
    
    // Delete all orders
    const ordersCollection = db.collection('orders');
    const orderCount = await ordersCollection.countDocuments();
    if (orderCount > 0) {
      const deleteResult = await ordersCollection.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} orders`);
    } else {
      console.log('ℹ️  No orders found');
    }
    
    // Delete all counters
    const countersCollection = db.collection('counters');
    const counterCount = await countersCollection.countDocuments();
    if (counterCount > 0) {
      const deleteResult = await countersCollection.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} counters`);
    } else {
      console.log('ℹ️  No counters found');
    }
    
    console.log('\n🔧 Fixing order indexes...');
    
    // List existing indexes on orders
    const existingIndexes = await ordersCollection.listIndexes().toArray();
    console.log('Current order indexes:');
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
    
    // Wait a moment for MongoDB to process the drops
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create only the compound unique index we want
    try {
      await ordersCollection.createIndex(
        { orderId: 1, userId: 1 }, 
        { unique: true, name: 'orderId_userId_unique' }
      );
      console.log('✅ Created compound unique index: orderId_userId_unique');
    } catch (error) {
      console.log('❌ Error creating compound index:', error.message);
    }
    
    // Create other non-unique indexes
    await ordersCollection.createIndex({ userId: 1 }, { name: 'userId_1' });
    console.log('✅ Created index: userId_1');
    
    await ordersCollection.createIndex({ orderStatus: 1 }, { name: 'orderStatus_1' });
    console.log('✅ Created index: orderStatus_1');
    
    await ordersCollection.createIndex({ createdAt: -1 }, { name: 'createdAt_-1' });
    console.log('✅ Created index: createdAt_-1');
    
    // Verify final state
    console.log('\n📊 Final database state:');
    const finalIndexes = await ordersCollection.listIndexes().toArray();
    console.log('Order indexes:');
    finalIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });
    
    const finalUserCount = await usersCollection.countDocuments();
    const finalProductCount = await productsCollection.countDocuments();
    const finalOrderCount = await ordersCollection.countDocuments();
    const finalCounterCount = await countersCollection.countDocuments();
    
    console.log(`\nCollection counts:`);
    console.log(`- Users: ${finalUserCount}`);
    console.log(`- Products: ${finalProductCount}`);
    console.log(`- Orders: ${finalOrderCount}`);
    console.log(`- Counters: ${finalCounterCount}`);
    
    console.log('\n🎉 Database completely reset! Ready for fresh start.');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the complete reset
completeDbReset().catch(console.error);
