import { connectDB, Order, Product, User } from "@/models/models";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET - Fetch all orders for the current user
export async function GET(request) {
  try {
    await connectDB();
    
    const userId = cookies().get("userId")?.value;
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const orders = await Order.find({ userId, isActive: true })
      .populate('orderItems.productId', 'name price')
      .sort({ orderDate: -1 });

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error("GET Orders Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST - Create a new order
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { orderItems, receivedBy, orderStatus = "confirmed" } = body;
    const userId = cookies().get("userId")?.value;
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        { error: "Order items are required" },
        { status: 400 }
      );
    }
    if (!receivedBy) {
      return NextResponse.json(
        { error: "Received by is required" },
        { status: 400 }
      );
    }

    // Get user information for userName
    const user = await User.findById(userId).select('fullName');
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Validate and enrich order items with product data
    const enrichedItems = [];
    let calculatedTotal = 0;
    
    for (const item of orderItems) {
      const product = await Product.findById(item.productId).select('name price stock');
      
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;

      enrichedItems.push({
        productId: item.productId,
        productName: product.name,
        productPrice: product.price,
        quantity: item.quantity,
        itemTotal: itemTotal
      });
    }

    // Generate current time
    const now = new Date();
    const orderTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    // Create the order with all required fields
    const order = new Order({
      orderItems: enrichedItems,
      orderTotal: calculatedTotal,
      orderTime: orderTime,
      receivedBy,
      orderStatus,
      userId,
      userName: user.fullName
    });

    await order.save();

    // Update product stock
    for (const item of enrichedItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Populate the created order for response
    await order.populate('orderItems.productId', 'name price');

    return NextResponse.json({
      success: true,
      order,
      message: "Order created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("POST Order Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing order
export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { orderId, orderItems, receivedBy, orderStatus } = body;
    const userId = cookies().get("userId")?.value;
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // If updating order items, restore previous stock and validate new items
    if (orderItems) {
      // Restore stock from previous order
      for (const item of existingOrder.orderItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } }
        );
      }

      // Validate and enrich new order items
      const enrichedItems = [];
      let calculatedTotal = 0;
      
      for (const item of orderItems) {
        const product = await Product.findById(item.productId).select('name price stock');
        
        if (!product) {
          return NextResponse.json(
            { error: `Product with ID ${item.productId} not found` },
            { status: 404 }
          );
        }

        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` },
            { status: 400 }
          );
        }

        const itemTotal = product.price * item.quantity;
        calculatedTotal += itemTotal;

        enrichedItems.push({
          productId: item.productId,
          productName: product.name,
          productPrice: product.price,
          quantity: item.quantity,
          itemTotal: itemTotal
        });
      }

      existingOrder.orderItems = enrichedItems;
      existingOrder.orderTotal = calculatedTotal;

      // Update product stock with new quantities
      for (const item of enrichedItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    // Update other fields
    if (receivedBy) existingOrder.receivedBy = receivedBy;
    if (orderStatus) existingOrder.orderStatus = orderStatus;

    await existingOrder.save();
    await existingOrder.populate('orderItems.productId', 'name price');

    return NextResponse.json({
      success: true,
      order: existingOrder,
      message: "Order updated successfully"
    });

  } catch (error) {
    console.error("PUT Order Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete an order
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const userId = cookies().get("userId")?.value;
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Restore stock before soft deleting
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }

    // Soft delete
    order.isActive = false;
    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error) {
    console.error("DELETE Order Error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}