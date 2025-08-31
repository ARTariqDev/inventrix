import { connectDB, Order } from '../src/models/models.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkOrderDates() {
  try {
    await connectDB();
    console.log('Connected to database');

    const userId = '68b2c3a1879fffcdf760f7bc';
    
    const orders = await Order.find({ userId, isActive: true })
      .select('orderId orderDate orderTotal')
      .sort({ orderDate: 1 });

    console.log('\n📅 Order Dates:');
    console.log('Found', orders.length, 'orders for user:', userId);
    
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderId} - ${order.orderDate.toISOString()} - $${order.orderTotal}`);
    });

    if (orders.length > 0) {
      const earliestDate = orders[0].orderDate;
      const latestDate = orders[orders.length - 1].orderDate;
      console.log('\n📊 Date Range:');
      console.log('Earliest:', earliestDate.toISOString());
      console.log('Latest:', latestDate.toISOString());
      
      // Check current filter range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      console.log('\n🔍 Current Filter Range (last 30 days):');
      console.log('Start:', startDate.toISOString());
      console.log('End:', endDate.toISOString());
      
      // Check how many orders fall within the current filter
      const ordersInRange = orders.filter(order => 
        order.orderDate >= startDate && order.orderDate <= endDate
      );
      console.log('\n✅ Orders in current filter range:', ordersInRange.length);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrderDates();
