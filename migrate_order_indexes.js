require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://saimiqbalmughal:d5pILZcQD1dJ1Ij8@ims.u0cfykv.mongodb.net/?retryWrites=true&w=majority&appName=IMS';

async function migrateOrderIndexes() {
  let client;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    
    console.log('Connected to MongoDB');
    
    // List existing indexes
    console.log('\nExisting indexes on orders collection:');
    const existingIndexes = await ordersCollection.listIndexes().toArray();
    existingIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Drop the old global unique index on orderId if it exists
    try {
      await ordersCollection.dropIndex('orderId_1');
      console.log('\n✅ Dropped old global unique index on orderId');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('\n❌ Global orderId index not found (already dropped or never existed)');
      } else {
        console.log('\n❌ Error dropping orderId index:', error.message);
      }
    }
    
    // Create new compound unique index
    try {
      await ordersCollection.createIndex(
        { orderId: 1, userId: 1 }, 
        { unique: true, name: 'orderId_userId_unique' }
      );
      console.log('✅ Created new compound unique index on orderId + userId');
    } catch (error) {
      if (error.code === 11000) {
        console.log('❌ Compound index creation failed - duplicate data exists');
        
        // Find and display duplicate order IDs
        const duplicates = await ordersCollection.aggregate([
          { $group: { _id: { orderId: "$orderId", userId: "$userId" }, count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } }
        ]).toArray();
        
        if (duplicates.length > 0) {
          console.log('\nFound duplicate orderId + userId combinations:');
          duplicates.forEach(dup => {
            console.log(`- orderId: ${dup._id.orderId}, userId: ${dup._id.userId}, count: ${dup.count}`);
          });
        }
      } else {
        console.log('❌ Error creating compound index:', error.message);
      }
    }
    
    // List final indexes
    console.log('\nFinal indexes on orders collection:');
    const finalIndexes = await ordersCollection.listIndexes().toArray();
    finalIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the migration
migrateOrderIndexes().catch(console.error);
