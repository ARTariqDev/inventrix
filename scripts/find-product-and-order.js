const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const { MONGODB_URI } = process.env;

const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const OrderSchema = new mongoose.Schema({}, { strict: false, collection: 'orders' });

const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Search for product by name (case-insensitive, partial match)
    const productName = process.argv[2] || 'BLACK CAMEL STEAM KAINAT';
    const products = await Product.find({ name: { $regex: productName, $options: 'i' } }).limit(20).lean();

    console.log(`\n🔎 Products matching "${productName}": ${products.length}`);
    products.forEach(p => {
      console.log(`  - _id: ${p._id}, name: ${p.name}, sku: ${p.sku}, purchasePrice: ${p.purchasePrice}, salePrice: ${p.salePrice}, stock: ${p.stock}, isActive: ${p.isActive}`);
    });

    // If no direct product matches, try tokenized partial matches
    if (products.length === 0) {
      const tokens = productName.split(/\s+/).map(t => t.replace(/[^\w]/g, '')).filter(Boolean);
      if (tokens.length > 0) {
        const tokenRegex = tokens.join('|');
        const partialProducts = await Product.find({ name: { $regex: tokenRegex, $options: 'i' } }).limit(50).lean();
        console.log(`\n🔎 Partial product name matches using tokens "${tokens.join(', ')}": ${partialProducts.length}`);
        partialProducts.forEach(p => console.log(`  - _id: ${p._id}, name: ${p.name}, sku: ${p.sku}, purchasePrice: ${p.purchasePrice}, salePrice: ${p.salePrice}, stock: ${p.stock}, isActive: ${p.isActive}`));
      }

      // Also search orders that might have the productName stored in orderItems
      const ordersWithProductName = await Order.find({ 'orderItems.productName': { $regex: productName, $options: 'i' } }).limit(50).lean();
      console.log(`\n🔎 Orders containing product name "${productName}" in orderItems: ${ordersWithProductName.length}`);
      ordersWithProductName.forEach(o => {
        console.log(`  - ${o.orderId || o._id}  userId=${o.userId}  total=${o.orderTotal}`);
        o.orderItems.forEach(it => {
          if (it.productName && it.productName.match(new RegExp(productName, 'i'))) {
            console.log(`      * item: ${it.productName} qty=${it.quantity} productPrice=${it.productPrice} purchasePrice=${it.purchasePrice} itemTotal=${it.itemTotal}`);
          }
        });
      });
    }

    // Search for order by orderId or user email
    const orderId = process.argv[3] || 'ORD00161';
    const userEmail = process.argv[4] || 'lahorim@yahoo.com';

    let order = null;
    if (orderId) {
      order = await Order.findOne({ orderId }).lean();
    }

    if (!order && userEmail) {
      // Try to find user and recent orders by email
      const usersCollection = mongoose.connection.collection('users');
      const user = await usersCollection.findOne({ email: userEmail.toLowerCase() });
      if (user) {
        console.log(`\n🔎 Found user with email ${userEmail}: _id=${user._id}, fullName=${user.fullName}`);
        const userOrders = await Order.find({ userId: user._id }).sort({ orderDate: -1 }).limit(10).lean();
        if (userOrders.length > 0) {
          console.log(`\n📦 Recent orders for ${userEmail}: (${userOrders.length})`);
          userOrders.forEach(o => console.log(`  - ${o.orderId}  total=${o.orderTotal}  date=${o.orderDate}`));
          // Use the first order as a sample
          order = userOrders[0];
        } else {
          console.log(`\n📦 No orders found for user ${userEmail}`);
        }
      } else {
        console.log(`\n🔎 No user found with email ${userEmail}`);
      }
    }

    if (order) {
      console.log(`\n📦 Order found: ${order.orderId} (id: ${order._id})`);
      console.log(`  userId: ${order.userId}, userName: ${order.userName}, phoneNumber: ${order.phoneNumber}`);
      console.log('  Items:');
      order.orderItems.forEach(item => {
        console.log(`    - productId: ${item.productId}, name: ${item.productName}, qty: ${item.quantity}, productPrice: ${item.productPrice}, purchasePrice: ${item.purchasePrice}, itemTotal: ${item.itemTotal}`);
      });
      console.log(`  Subtotal: ${order.subtotal}, OrderTotal: ${order.orderTotal}, Discount: ${order.discountAmount}`);
    } else {
      console.log(`\n📦 Order with orderId ${orderId} not found and no orders found for ${userEmail}`);
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();