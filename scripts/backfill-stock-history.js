/**
 * Backfill StockHistory for existing products
 * This script creates initial StockHistory entries for all existing products
 * based on their createdAt date and current stock levels.
 * 
 * Run with: node scripts/backfill-stock-history.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// StockHistory Schema (same as in models.js)
const StockHistorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    previousStock: { type: Number, required: true, default: 0 },
    newStock: { type: Number, required: true },
    stockAdded: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    changeType: { type: String, enum: ["create", "update"], required: true },
    changeDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema({
  sku: String,
  name: String,
  description: String,
  category: String,
  purchasePrice: Number,
  salePrice: Number,
  stock: Number,
  userId: mongoose.Schema.Types.ObjectId,
  userName: String,
  isActive: Boolean,
}, { timestamps: true });

async function backfillStockHistory() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'myapp',
    });
    
    console.log('✅ Connected to MongoDB');

    const Product = mongoose.model('Product', ProductSchema);
    const StockHistory = mongoose.model('StockHistory', StockHistorySchema);

    // Get count of existing stock history entries
    const existingCount = await StockHistory.countDocuments();
    console.log(`📊 Existing StockHistory entries: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  StockHistory already has entries. Do you want to continue?');
      console.log('   This will add entries for products that don\'t have any history yet.');
    }

    // Get all active products
    const products = await Product.find({ isActive: true });
    console.log(`📦 Found ${products.length} active products`);

    let created = 0;
    let skipped = 0;

    for (const product of products) {
      // Check if this product already has stock history
      const hasHistory = await StockHistory.findOne({ productId: product._id });
      
      if (hasHistory) {
        skipped++;
        continue;
      }

      // Only create history if product has stock > 0
      if (product.stock > 0) {
        const stockHistory = new StockHistory({
          productId: product._id,
          userId: product.userId,
          previousStock: 0,
          newStock: product.stock,
          stockAdded: product.stock,
          purchasePrice: product.purchasePrice || 0,
          totalCost: product.stock * (product.purchasePrice || 0),
          changeType: 'create',
          changeDate: product.createdAt || new Date(), // Use product creation date
        });

        await stockHistory.save();
        created++;
        
        console.log(`  ✅ Created history for "${product.name}" (SKU: ${product.sku})`);
        console.log(`     Stock: ${product.stock}, Purchase Price: ${product.purchasePrice}, Total Cost: ${stockHistory.totalCost}`);
        console.log(`     Date: ${stockHistory.changeDate.toISOString()}`);
      } else {
        console.log(`  ⏭️  Skipped "${product.name}" (stock is 0)`);
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKFILL COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${created} stock history entries`);
    console.log(`⏭️  Skipped: ${skipped} products (already have history or stock is 0)`);
    console.log('='.repeat(60));

    // Show summary by month
    console.log('\n📅 Stock History by Month:');
    const monthlySummary = await StockHistory.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$changeDate' },
            month: { $month: '$changeDate' }
          },
          totalSpent: { $sum: '$totalCost' },
          totalStockAdded: { $sum: '$stockAdded' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    monthlySummary.forEach(item => {
      const monthStr = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      console.log(`  ${monthStr}: ${item.count} entries, ${item.totalStockAdded} units, $${item.totalSpent.toFixed(2)} spent`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

backfillStockHistory();
