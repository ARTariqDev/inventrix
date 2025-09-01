import mongoose from 'mongoose';
import { connectDB } from '../src/models/models.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateProducts() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Access the products collection directly to migrate data
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // Find all products with the old 'price' field
    const productsWithOldSchema = await productsCollection.find({ 
      price: { $exists: true },
      $or: [
        { purchasePrice: { $exists: false } },
        { salePrice: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${productsWithOldSchema.length} products to migrate`);

    if (productsWithOldSchema.length > 0) {
      for (const product of productsWithOldSchema) {
        const updateData = {};
        
        // If the product has a price field but no purchasePrice/salePrice
        if (product.price !== undefined) {
          // Set both purchasePrice and salePrice to the old price value
          // You might want to adjust this logic based on your business needs
          updateData.purchasePrice = product.price;
          updateData.salePrice = product.price;
        }

        // Remove the old price field
        const result = await productsCollection.updateOne(
          { _id: product._id },
          { 
            $set: updateData,
            $unset: { price: "" }
          }
        );

        console.log(`Migrated product: ${product.name} (ID: ${product._id})`);
      }

      console.log('✅ Migration completed successfully');
    } else {
      console.log('✅ No products need migration');
    }

    // Verify the migration
    const remainingOldProducts = await productsCollection.find({ price: { $exists: true } }).toArray();
    console.log(`Products with old 'price' field remaining: ${remainingOldProducts.length}`);

    const newProducts = await productsCollection.find({ 
      purchasePrice: { $exists: true },
      salePrice: { $exists: true }
    }).toArray();
    console.log(`Products with new schema: ${newProducts.length}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateProducts();
