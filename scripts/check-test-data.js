const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  fullName: String,
}, { collection: 'users' });

const productSchema = new mongoose.Schema({
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

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: 'artariqdev@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📦 Products:');
    const products = await Product.find({ userId: user._id, isActive: true });
    products.forEach(p => {
      console.log(`   ${p.name}: Purchase=${p.purchasePrice}, Sale=${p.salePrice}, Profit=${p.salePrice - p.purchasePrice}`);
    });

    console.log('\n📝 Orders:');
    const orders = await Order.find({ userId: user._id, isActive: true }).sort({ orderDate: 1 });
    for (const order of orders) {
      const product = await Product.findById(order.orderItems[0].productId);
      const qty = order.orderItems[0].quantity;
      const profit = product ? (product.salePrice - product.purchasePrice) * qty : 0;
      const spent = product ? product.purchasePrice * qty : 0;
      
      console.log(`   ${order.orderId} (${order.orderDate.toISOString().substring(0, 7)}): Qty=${qty}, Profit=${profit}, Spent=${spent}`);
    }

    // Test the aggregation
    console.log('\n📊 Monthly Aggregation Test:');
    const monthlyData = await Order.aggregate([
      {
        $match: {
          userId: user._id,
          isActive: true,
          orderDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.productId",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" }
          },
          totalProfit: {
            $sum: {
              $multiply: [
                { $subtract: ["$productInfo.salePrice", "$productInfo.purchasePrice"] },
                "$orderItems.quantity"
              ]
            }
          },
          totalSpent: {
            $sum: {
              $multiply: ["$productInfo.purchasePrice", "$orderItems.quantity"]
            }
          },
          totalRevenue: {
            $sum: {
              $multiply: ["$productInfo.salePrice", "$orderItems.quantity"]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    monthlyData.forEach(item => {
      console.log(`   ${item._id.year}-${String(item._id.month).padStart(2, '0')}: Profit=${item.totalProfit}, Spent=${item.totalSpent}, Revenue=${item.totalRevenue}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();
