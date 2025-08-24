import { connectDB, Product } from "@/models/models";
import { NextResponse } from "next/server";


export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 100;
    const skip = (page - 1) * limit;


    let filter = {};
    

    const isActive = searchParams.get('isActive');
    if (isActive !== null && isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }


    const name = searchParams.get('name');
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    const category = searchParams.get('category');
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    const sku = searchParams.get('sku');
    if (sku) {
      filter.sku = { $regex: sku, $options: 'i' };
    }


    const price = searchParams.get('price');
    const priceOperator = searchParams.get('priceOperator') || 'equal';
    if (price) {
      const priceNum = Number(price);
      switch (priceOperator) {
        case 'greater':
          filter.price = { $gt: priceNum };
          break;
        case 'less':
          filter.price = { $lt: priceNum };
          break;
        case 'not-equal':
          filter.price = { $ne: priceNum };
          break;
        default:
          filter.price = priceNum;
      }
    }

    const stock = searchParams.get('stock');
    const stockOperator = searchParams.get('stockOperator') || 'equal';
    if (stock) {
      const stockNum = Number(stock);
      switch (stockOperator) {
        case 'greater':
          filter.stock = { $gt: stockNum };
          break;
        case 'less':
          filter.stock = { $lt: stockNum };
          break;
        case 'not-equal':
          filter.stock = { $ne: stockNum };
          break;
        default:
          filter.stock = stockNum;
      }
    }


    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    await connectDB();

    const { name, description, category, price, stock } = await request.json();


    if (!name || !category || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Name, category, price, and stock are required" },
        { status: 400 }
      );
    }


    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be a valid non-negative number" },
        { status: 400 }
      );
    }

    if (isNaN(stock) || stock < 0 || !Number.isInteger(Number(stock))) {
      return NextResponse.json(
        { error: "Stock must be a valid non-negative integer" },
        { status: 400 }
      );
    }

    // Generate SKU (simple implementation)
    const generateSKU = () => {
      const prefix = category.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `${prefix}-${timestamp}-${random}`;
    };

    // Create new product with auto-generated SKU
    const product = new Product({
      name: name.trim(),
      description: description?.trim() || '',
      category: category.trim(),
      sku: generateSKU(),
      price: Number(price),
      stock: Number(stock),
      isActive: true
    });

    const savedProduct = await product.save();

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product: savedProduct
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating product:", error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}


export async function PUT(request) {
  try {
    await connectDB();

    const { id, updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Validate updates
    const allowedUpdates = ['name', 'description', 'category', 'price', 'stock', 'isActive'];
    const updateFields = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'price' || key === 'stock') {
          const numValue = Number(updates[key]);
          if (isNaN(numValue) || numValue < 0) {
            throw new Error(`${key} must be a valid non-negative number`);
          }
          if (key === 'stock' && !Number.isInteger(numValue)) {
            throw new Error('Stock must be an integer');
          }
          updateFields[key] = numValue;
        } else if (key === 'isActive') {
          updateFields[key] = Boolean(updates[key]);
        } else {
          updateFields[key] = String(updates[key]).trim();
        }
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { ...updateFields, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    console.error("Error updating product:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}


export async function DELETE(request) {
  try {
    await connectDB();

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }


    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // For now, I'll do a hard delete. TODO:
    // 1. Check if product is referenced in any orders
    // 2. Do a soft delete (set isActive: false) instead of hard delete
    
    await Product.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}