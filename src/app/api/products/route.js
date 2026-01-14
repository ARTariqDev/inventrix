import { connectDB, Product, User, StockHistory } from "@/models/models";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 100;
    const skip = (page - 1) * limit;

    let filter = { userId, isActive: true };

    const isActive = searchParams.get("isActive");
    if (isActive !== null && isActive !== undefined) {
      if (isActive === "all") {
        delete filter.isActive;
      } else {
        filter.isActive = isActive === "true";
      }
    }

    // ✅ Filter by name
    const name = searchParams.get("name");
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    // ✅ Filter by category
    const category = searchParams.get("category");
    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    // ✅ Filter by sku
    const sku = searchParams.get("sku");
    if (sku) {
      filter.sku = { $regex: sku, $options: "i" };
    }

    // ✅ Filter by username (redundant since userId is enforced, but kept for admin extension)
    const username = searchParams.get("username");
    if (username) {
      filter.userName = { $regex: username, $options: "i" };
    }

    // ✅ Sale Price filtering
    const salePrice = searchParams.get("salePrice");
    const salePriceOperator = searchParams.get("salePriceOperator") || "equal";
    if (salePrice) {
      const salePriceNum = Number(salePrice);
      switch (salePriceOperator) {
        case "greater":
          filter.salePrice = { $gt: salePriceNum };
          break;
        case "less":
          filter.salePrice = { $lt: salePriceNum };
          break;
        case "not-equal":
          filter.salePrice = { $ne: salePriceNum };
          break;
        default:
          filter.salePrice = salePriceNum;
      }
    }

    // ✅ Purchase Price filtering
    const purchasePrice = searchParams.get("purchasePrice");
    const purchasePriceOperator = searchParams.get("purchasePriceOperator") || "equal";
    if (purchasePrice) {
      const purchasePriceNum = Number(purchasePrice);
      switch (purchasePriceOperator) {
        case "greater":
          filter.purchasePrice = { $gt: purchasePriceNum };
          break;
        case "less":
          filter.purchasePrice = { $lt: purchasePriceNum };
          break;
        case "not-equal":
          filter.purchasePrice = { $ne: purchasePriceNum };
          break;
        default:
          filter.purchasePrice = purchasePriceNum;
      }
    }

    // ✅ Stock filtering
    const stock = searchParams.get("stock");
    const stockOperator = searchParams.get("stockOperator") || "equal";
    if (stock) {
      const stockNum = Number(stock);
      switch (stockOperator) {
        case "greater":
          filter.stock = { $gt: stockNum };
          break;
        case "less":
          filter.stock = { $lt: stockNum };
          break;
        case "not-equal":
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
        hasPrev: page > 1,
      },
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

    // ✅ Get userId from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, category, purchasePrice, salePrice, stock } = await request.json();

    if (!name || !category || purchasePrice === undefined || salePrice === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Name, category, purchase price, sale price, and stock are required" },
        { status: 400 }
      );
    }

    if (isNaN(purchasePrice) || purchasePrice < 0) {
      return NextResponse.json(
        { error: "Purchase price must be a valid non-negative number" },
        { status: 400 }
      );
    }

    if (isNaN(salePrice) || salePrice < 0) {
      return NextResponse.json(
        { error: "Sale price must be a valid non-negative number" },
        { status: 400 }
      );
    }

    if (isNaN(stock) || stock < 0 || !Number.isInteger(Number(stock))) {
      return NextResponse.json(
        { error: "Stock must be a valid non-negative integer" },
        { status: 400 }
      );
    }

    // ✅ Fetch userName from User collection
    const user = await User.findById(userId).select("fullName");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🚫 Prevent duplicate products for same user, name, and category
    const existingProduct = await Product.findOne({
      userId: user._id,
      name: name.trim(),
      category: category.trim(),
      isActive: true,
    });
    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this name and category already exists." },
        { status: 409 }
      );
    }

    // ✅ Create new product (sku auto-generated by pre-save hook)
    const product = new Product({
      name: name.trim(),
      description: description?.trim() || "",
      category: category.trim(),
      purchasePrice: Number(purchasePrice),
      salePrice: Number(salePrice),
      stock: Number(stock),
      userId: user._id,
      userName: user.fullName,
      isActive: true,
    });

    const savedProduct = await product.save();

    // Log stock history for new product creation
    if (savedProduct.stock > 0) {
      const stockHistory = new StockHistory({
        productId: savedProduct._id,
        userId: user._id,
        previousStock: 0,
        newStock: savedProduct.stock,
        stockAdded: savedProduct.stock,
        purchasePrice: savedProduct.purchasePrice,
        totalCost: savedProduct.stock * savedProduct.purchasePrice,
        changeType: "create",
        changeDate: new Date(),
      });
      await stockHistory.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product: savedProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
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

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, updates } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const { name, description, category, purchasePrice, salePrice, stock, isActive } = updates;

    // Validation
    if (!name || !category || purchasePrice === undefined || salePrice === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Name, category, purchase price, sale price, and stock are required" },
        { status: 400 }
      );
    }

    if (isNaN(purchasePrice) || purchasePrice < 0) {
      return NextResponse.json(
        { error: "Purchase price must be a valid non-negative number" },
        { status: 400 }
      );
    }

    if (isNaN(salePrice) || salePrice < 0) {
      return NextResponse.json(
        { error: "Sale price must be a valid non-negative number" },
        { status: 400 }
      );
    }

    if (isNaN(stock) || stock < 0 || !Number.isInteger(Number(stock))) {
      return NextResponse.json(
        { error: "Stock must be a valid non-negative integer" },
        { status: 400 }
      );
    }

    // Find product and verify ownership
    const existingProduct = await Product.findOne({ _id: id, userId });
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found or unauthorized" },
        { status: 404 }
      );
    }

    // Calculate stock difference for stock history
    const previousStock = existingProduct.stock;
    const newStock = Number(stock);
    const stockAdded = newStock - previousStock;

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: description?.trim() || "",
        category: category.trim(),
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        stock: Number(stock),
        isActive: isActive !== undefined ? isActive : existingProduct.isActive
      },
      { new: true, runValidators: true }
    );

    // Log stock history if stock was increased
    if (stockAdded > 0) {
      const stockHistory = new StockHistory({
        productId: updatedProduct._id,
        userId: existingProduct.userId,
        previousStock: previousStock,
        newStock: newStock,
        stockAdded: stockAdded,
        purchasePrice: Number(purchasePrice), // Use current purchase price
        totalCost: stockAdded * Number(purchasePrice),
        changeType: "update",
        changeDate: new Date(),
      });
      await stockHistory.save();
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });

  } catch (error) {
    console.error("Error updating product:", error);
    
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Find product and verify ownership
    const existingProduct = await Product.findOne({ _id: id, userId });
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found or unauthorized" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      product: deletedProduct
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}