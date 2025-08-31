require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function checkAllCounters() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const countersCollection = db.collection('counters');
  
  console.log('All counters in database:');
  const counters = await countersCollection.find({}).toArray();
  
  if (counters.length === 0) {
    console.log('No counters found');
  } else {
    counters.forEach(counter => {
      console.log(`- ${counter._id}: ${counter.sequence_value}`);
    });
  }
  
  await client.close();
}

checkAllCounters().catch(console.error);
