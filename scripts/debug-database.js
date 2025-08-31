import { connectDB, User, Order, Product } from '../src/models/models.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugDatabase() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find the user john@example.com
    const user = await User.findOne({ email: 'john@example.com' });
    if (!user) {
      console.log('❌ User john@example.com not found');
      return;
    }
    console.log('✅ Found user:', user.fullName, 'with ID:', user._id.toString());

    // Check orders for this user
    const orders = await Order.find({ userId: user._id, isActive: true });
    console.log('📊 Orders found:', orders.length);

    if (orders.length > 0) {
      console.log('Sample orders:');
      orders.slice(0, 3).forEach(order => {
        console.log(`- ${order.orderId}: $${order.orderTotal} on ${order.orderDate.toDateString()}`);
      });

      // Calculate total revenue
      const totalRevenue = orders.reduce((sum, order) => sum + order.orderTotal, 0);
      console.log('💰 Total Revenue:', totalRevenue.toFixed(2));
    }

    // Check products
    const products = await Product.find({ userId: user._id, isActive: true });
    console.log('📦 Products found:', products.length);

    // Check recent date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log('📅 Date range:', startDate.toDateString(), 'to', endDate.toDateString());
    
    const recentOrders = await Order.find({ 
      userId: user._id, 
      isActive: true,
      orderDate: { $gte: startDate, $lte: endDate }
    });
    console.log('📈 Recent orders (last 30 days):', recentOrders.length);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugDatabase();
