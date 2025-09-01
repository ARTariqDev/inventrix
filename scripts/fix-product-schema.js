import mongoose from 'mongoose';
import { connectDB, Product } from '../src/models/models.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixProductSchema() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Check current products
    const products = await Product.find({}).limit(5);
    console.log('Current products structure:');
    products.forEach(product => {
      console.log('Product:', product.name);
      console.log('Fields:', Object.keys(product.toObject()));
      console.log('---');
    });

    // Check if there are any products with the old 'price' field
    const productsWithOldField = await Product.find({ price: { $exists: true } });
    console.log('Products with old "price" field:', productsWithOldField.length);

    if (productsWithOldField.length > 0) {
      console.log('Found products with old "price" field. Migrating...');
      
      // Migrate old price field to salePrice if needed
      for (const product of productsWithOldField) {
        if (product.price && !product.salePrice) {
          product.salePrice = product.price;
          // Remove the old price field
          product.set('price', undefined, { strict: false });
          await product.save();
          console.log(`Migrated price for product: ${product.name}`);
        }
      }
    }

    // Get the actual schema from the model
    console.log('Current Product schema paths:');
    console.log(Object.keys(Product.schema.paths));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixProductSchema();
