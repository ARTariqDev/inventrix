import { connectDB, User, Product, Order } from '../src/models/models.js';
import dotenv from 'dotenv';

dotenv.config();

async function addSampleData() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find the user with email john@example.com
    const user = await User.findOne({ email: 'john@example.com' });
    if (!user) {
      console.log('User john@example.com not found. Please create this user first.');
      return;
    }
    console.log('Found user:', user.fullName);

    // First, let's add some sample products if they don't exist
    const sampleProducts = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality noise-canceling headphones with 30-hour battery life',
        category: 'Electronics',
        price: 129.99,
        stock: 50,
        userId: user._id,
        userName: user.fullName
      },
      {
        name: 'Ergonomic Office Chair',
        description: 'Comfortable office chair with lumbar support and adjustable height',
        category: 'Furniture',
        price: 299.99,
        stock: 25,
        userId: user._id,
        userName: user.fullName
      },
      {
        name: 'Smart Water Bottle',
        description: 'Temperature-controlled smart water bottle with app connectivity',
        category: 'Health',
        price: 79.99,
        stock: 100,
        userId: user._id,
        userName: user.fullName
      },
      {
        name: 'USB-C Power Bank',
        description: '20000mAh portable charger with fast charging capability',
        category: 'Electronics',
        price: 49.99,
        stock: 75,
        userId: user._id,
        userName: user.fullName
      },
      {
        name: 'Organic Coffee Beans',
        description: 'Premium organic coffee beans from sustainable farms',
        category: 'Food',
        price: 24.99,
        stock: 200,
        userId: user._id,
        userName: user.fullName
      }
    ];

    // Add products if they don't exist
    const existingProducts = await Product.find({ userId: user._id });
    let products = existingProducts;

    if (existingProducts.length === 0) {
      console.log('Adding sample products...');
      products = await Product.insertMany(sampleProducts);
      console.log('Added', products.length, 'products');
    } else {
      console.log('Using existing products:', existingProducts.length);
    }

    // Generate sample orders with varying dates over the last 30 days
    const orders = [];
    const statuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    const customers = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eva Brown'];
    const addresses = [
      '123 Main Street, Apt 4B, New York, NY 10001',
      '456 Oak Avenue, Suite 200, Los Angeles, CA 90210',
      '789 Pine Road, Unit 15, Chicago, IL 60601',
      '321 Elm Street, Floor 3, Houston, TX 77001',
      '654 Maple Drive, Building A, Miami, FL 33101'
    ];
    const phoneNumbers = [
      '+1 (555) 123-4567',
      '+1 (555) 987-6543',
      '+1 (555) 456-7890',
      '+1 (555) 234-5678',
      '+1 (555) 876-5432'
    ];

    for (let i = 0; i < 20; i++) {
      // Random date in the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      // Random number of items (1-3)
      const numItems = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];

      for (let j = 0; j < numItems; j++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        
        orderItems.push({
          productId: randomProduct._id,
          productName: randomProduct.name,
          productPrice: randomProduct.price,
          quantity: quantity,
          itemTotal: Math.round(randomProduct.price * quantity * 100) / 100
        });
      }

      const orderTotal = Math.round(orderItems.reduce((sum, item) => sum + item.itemTotal, 0) * 100) / 100;
      const customerIndex = Math.floor(Math.random() * customers.length);

      orders.push({
        orderItems,
        orderTotal,
        orderDate,
        orderTime: new Date(orderDate).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        receivedBy: customers[customerIndex],
        address: addresses[customerIndex],
        phoneNumber: phoneNumbers[customerIndex],
        orderStatus: statuses[Math.floor(Math.random() * statuses.length)],
        userId: user._id,
        userName: user.fullName
      });
    }

    // Check if orders already exist for this user
    const existingOrders = await Order.find({ userId: user._id });
    if (existingOrders.length > 0) {
      console.log('Orders already exist for this user:', existingOrders.length);
      console.log('Deleting existing orders and creating new ones...');
      await Order.deleteMany({ userId: user._id });
    }

    // Add the sample orders one by one to ensure pre-save hooks work
    console.log('Adding sample orders...');
    const createdOrders = [];
    
    for (const orderData of orders) {
      try {
        const order = new Order(orderData);
        const savedOrder = await order.save();
        createdOrders.push(savedOrder);
        console.log(`Created order ${savedOrder.orderId} - Rs ${savedOrder.orderTotal}`);
      } catch (error) {
        console.error('Error creating order:', error.message);
      }
    }
    
    console.log('Successfully added', createdOrders.length, 'orders');

    // Show summary
    console.log('\n📊 Data Summary:');
    console.log('User:', user.fullName, '(' + user.email + ')');
    console.log('Products:', products.length);
    console.log('Orders:', createdOrders.length);
    
    const totalRevenue = createdOrders.reduce((sum, order) => sum + order.orderTotal, 0);
    console.log('Total Revenue: $' + totalRevenue.toFixed(2));

    console.log('\n✅ Sample data added successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData();
