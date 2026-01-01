const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas
const userSchema = new mongoose.Schema({
  email: String,
  fullName: String,
}, { collection: 'users' });

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, uppercase: true },
  name: String,
  category: String,
  purchasePrice: Number,
  salePrice: Number,
  stock: Number,
  userId: mongoose.Schema.Types.ObjectId,
  isActive: { type: Boolean, default: true }
}, { collection: 'products' });

const orderSchema = new mongoose.Schema({
  orderId: String,
  userId: mongoose.Schema.Types.ObjectId,
  orderDate: Date,
  orderStatus: String,
  receivedBy: String,
  orderTotal: Number,
  orderItems: [{
    productId: mongoose.Schema.Types.ObjectId,
    productName: String,
    quantity: Number,
    price: Number,
    itemTotal: Number
  }],
  isActive: { type: Boolean, default: true }
}, { collection: 'orders' });

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

async function injectTestData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'myapp'
    });
    console.log('✅ Connected to MongoDB (database: myapp)');

    // Find the specific user
    let user = await User.findOne({ email: /^testtest@test\.com$/i });
    
    if (!user) {
      console.error('❌ User not found with email: testTest@test.com');
      console.log('Available users:');
      const users = await User.find({}).limit(5);
      users.forEach(u => console.log(`   - ${u.email}`));
      process.exit(1);
    }
    
    console.log('✅ Using user:', user.fullName, '(', user.email, ')');

    // Create test products with varying profit margins
    const testProducts = [
      {
        sku: 'TEST-LOSS-A',
        name: 'Loss Product A',
        category: 'Test',
        purchasePrice: 1000,
        salePrice: 800, // Negative profit: -200 per unit
        stock: 50,
        userId: user._id,
        isActive: true
      },
      {
        sku: 'TEST-LOSS-B',
        name: 'Loss Product B',
        category: 'Test',
        purchasePrice: 500,
        salePrice: 350, // Negative profit: -150 per unit
        stock: 30,
        userId: user._id,
        isActive: true
      },
      {
        sku: 'TEST-PROFIT-C',
        name: 'Profit Product',
        category: 'Test',
        purchasePrice: 200,
        salePrice: 400, // Positive profit: +200 per unit
        stock: 100,
        userId: user._id,
        isActive: true
      }
    ];

    console.log('📦 Creating test products...');
    const createdProducts = await Product.insertMany(testProducts);
    console.log('✅ Created products:', createdProducts.map(p => p.name));

    // Create orders for different months
    const orders = [];
    const now = new Date();

    // November 2025 - Heavy losses
    const nov2025 = new Date(2025, 10, 15); // November 15, 2025
    orders.push({
      orderId: `TEST-NOV-001`,
      userId: user._id,
      orderDate: nov2025,
      orderStatus: 'delivered',
      receivedBy: 'Test Customer A',
      orderItems: [
        {
          productId: createdProducts[0]._id,
          productName: createdProducts[0].name,
          quantity: 10,
          price: createdProducts[0].salePrice,
          itemTotal: createdProducts[0].salePrice * 10
        }
      ],
      orderTotal: createdProducts[0].salePrice * 10,
      isActive: true
    });

    orders.push({
      orderId: `TEST-NOV-002`,
      userId: user._id,
      orderDate: new Date(2025, 10, 20),
      orderStatus: 'delivered',
      receivedBy: 'Test Customer B',
      orderItems: [
        {
          productId: createdProducts[1]._id,
          productName: createdProducts[1].name,
          quantity: 8,
          price: createdProducts[1].salePrice,
          itemTotal: createdProducts[1].salePrice * 8
        }
      ],
      orderTotal: createdProducts[1].salePrice * 8,
      isActive: true
    });

    // December 2025 - Mixed results
    orders.push({
      orderId: `TEST-DEC-001`,
      userId: user._id,
      orderDate: new Date(2025, 11, 10),
      orderStatus: 'delivered',
      receivedBy: 'Test Customer C',
      orderItems: [
        {
          productId: createdProducts[0]._id,
          productName: createdProducts[0].name,
          quantity: 5,
          price: createdProducts[0].salePrice,
          itemTotal: createdProducts[0].salePrice * 5
        }
      ],
      orderTotal: createdProducts[0].salePrice * 5,
      isActive: true
    });

    orders.push({
      orderId: `TEST-DEC-002`,
      userId: user._id,
      orderDate: new Date(2025, 11, 15),
      orderStatus: 'delivered',
      receivedBy: 'Test Customer D',
      orderItems: [
        {
          productId: createdProducts[2]._id,
          productName: createdProducts[2].name,
          quantity: 15,
          price: createdProducts[2].salePrice,
          itemTotal: createdProducts[2].salePrice * 15
        }
      ],
      orderTotal: createdProducts[2].salePrice * 15,
      isActive: true
    });

    // January 2026 - Profitable
    orders.push({
      orderId: `TEST-JAN-001`,
      userId: user._id,
      orderDate: new Date(2026, 0, 5),
      orderStatus: 'delivered',
      receivedBy: 'Test Customer E',
      orderItems: [
        {
          productId: createdProducts[2]._id,
          productName: createdProducts[2].name,
          quantity: 20,
          price: createdProducts[2].salePrice,
          itemTotal: createdProducts[2].salePrice * 20
        }
      ],
      orderTotal: createdProducts[2].salePrice * 20,
      isActive: true
    });

    console.log('📝 Creating test orders...');
    const createdOrders = await Order.insertMany(orders);
    console.log('✅ Created orders:', createdOrders.map(o => o.orderId));

    console.log('\n📊 Test Data Summary:');
    console.log('   November 2025: Expected NEGATIVE profit (losses from Loss Products A & B)');
    console.log('   December 2025: Expected MIXED profit (losses + gains)');
    console.log('   January 2026: Expected POSITIVE profit (gains from Profit Product)');
    console.log('\n✅ Test data injection complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

injectTestData();
