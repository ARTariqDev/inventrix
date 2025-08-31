require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
async function testOrderCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Define a fresh schema (not importing from models.js to avoid any caching)
    const CounterSchema = new mongoose.Schema({
      _id: { type: String, required: true },
      sequence_value: { type: Number, default: 0 }
    });
    
    const OrderSchema = new mongoose.Schema({
      orderId: { type: String, uppercase: true },
      orderItems: [{
        productId: { type: mongoose.Schema.Types.ObjectId, required: true },
        productName: { type: String, required: true },
        productPrice: { type: Number, required: true },
        quantity: { type: Number, required: true },
        itemTotal: { type: Number, required: true }
      }],
      orderTotal: { type: Number, required: true },
      customerName: { type: String, required: true },
      customerEmail: { type: String, required: true },
      customerAddress: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      orderStatus: { type: String, enum: ["confirmed", "shipped", "delivered", "cancelled"], default: "confirmed" },
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userName: { type: String, required: true },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    
    // Add ONLY the compound unique index
    OrderSchema.index({ orderId: 1, userId: 1 }, { unique: true });
    OrderSchema.index({ userId: 1 });
    
    // Pre-save hook for auto-generating orderId
    OrderSchema.pre("save", async function (next) {
      if (this.isNew) {
        try {
          const counterKey = `orderId_${this.userId}`;
          
          const Counter = mongoose.models.TestCounter || mongoose.model("TestCounter", CounterSchema);
          const counter = await Counter.findByIdAndUpdate(
            { _id: counterKey },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true }
          );
          
          this.orderId = `ORD${String(counter.sequence_value).padStart(5, '0')}`;
          next();
        } catch (error) {
          console.error("Error in OrderSchema pre-save hook:", error);
          next(error);
        }
      } else {
        next();
      }
    });
    
    const TestOrder = mongoose.models.TestOrder || mongoose.model("TestOrder", OrderSchema);
    
    // Create two fake user IDs
    const user1Id = new mongoose.Types.ObjectId();
    const user2Id = new mongoose.Types.ObjectId();
    
    console.log(`\nTesting with users:`);
    console.log(`User 1: ${user1Id}`);
    console.log(`User 2: ${user2Id}`);
    
    // Test order creation for user 1
    console.log('\n📝 Creating order for User 1...');
    const order1 = new TestOrder({
      orderItems: [{
        productId: new mongoose.Types.ObjectId(),
        productName: "Test Product 1",
        productPrice: 100,
        quantity: 1,
        itemTotal: 100
      }],
      orderTotal: 100,
      customerName: "Test Customer 1",
      customerEmail: "test1@example.com",
      customerAddress: "Test Address 1",
      phoneNumber: "1234567890",
      userId: user1Id,
      userName: "Test User 1"
    });
    
    await order1.save();
    console.log(`✅ Order 1 created successfully: ${order1.orderId}`);
    
    // Test order creation for user 2
    console.log('\n📝 Creating order for User 2...');
    const order2 = new TestOrder({
      orderItems: [{
        productId: new mongoose.Types.ObjectId(),
        productName: "Test Product 2",
        productPrice: 200,
        quantity: 1,
        itemTotal: 200
      }],
      orderTotal: 200,
      customerName: "Test Customer 2",
      customerEmail: "test2@example.com",
      customerAddress: "Test Address 2",
      phoneNumber: "0987654321",
      userId: user2Id,
      userName: "Test User 2"
    });
    
    await order2.save();
    console.log(`✅ Order 2 created successfully: ${order2.orderId}`);
    
    // Test another order for user 1
    console.log('\n📝 Creating second order for User 1...');
    const order3 = new TestOrder({
      orderItems: [{
        productId: new mongoose.Types.ObjectId(),
        productName: "Test Product 3",
        productPrice: 300,
        quantity: 1,
        itemTotal: 300
      }],
      orderTotal: 300,
      customerName: "Test Customer 1",
      customerEmail: "test1@example.com",
      customerAddress: "Test Address 1",
      phoneNumber: "1234567890",
      userId: user1Id,
      userName: "Test User 1"
    });
    
    await order3.save();
    console.log(`✅ Order 3 created successfully: ${order3.orderId}`);
    
    // List all created orders
    console.log('\n📋 All created orders:');
    const allOrders = await TestOrder.find().sort({ createdAt: 1 });
    allOrders.forEach(order => {
      console.log(`- ${order.orderId} (User: ${order.userId})`);
    });
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await TestOrder.deleteMany({});
    await mongoose.model("TestCounter").deleteMany({ _id: { $regex: /^orderId_/ } });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Order creation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testOrderCreation().catch(console.error);
