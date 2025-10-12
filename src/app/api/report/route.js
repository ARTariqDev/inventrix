import { connectDB, Order, Product } from "@/models/models";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // Format: "09" for September
    const yearParam = searchParams.get("year"); // Optional, defaults to current year

    if (!monthParam) {
      return NextResponse.json({ error: "Month parameter is required" }, { status: 400 });
    }

    const month = parseInt(monthParam);
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Create date range for the entire month
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

    console.log("📊 Report API - Generating report for:", {
      month: monthParam,
      year,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Filter for orders in the specified month
    const orderFilter = { 
      userId: userObjectId, 
      isActive: true,
      orderDate: { $gte: startDate, $lte: endDate }
    };

    // Get all products (current state)
    const products = await Product.find({ 
      userId: userObjectId, 
      isActive: true 
    }).lean();

    // Get orders for the month with populated product info
    const orders = await Order.aggregate([
      { $match: orderFilter },
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
          _id: "$_id",
          orderId: { $first: "$orderId" },
          orderDate: { $first: "$orderDate" },
          orderTotal: { $first: "$orderTotal" },
          orderStatus: { $first: "$orderStatus" },
          receivedBy: { $first: "$receivedBy" },
          phoneNumber: { $first: "$phoneNumber" },
          discountAmount: { $first: "$discountAmount" },
          remainingAmount: { $first: "$remainingAmount" },
          orderItems: {
            $push: {
              productId: "$orderItems.productId",
              productName: "$productInfo.name",
              quantity: "$orderItems.quantity",
              salePrice: "$productInfo.salePrice",
              purchasePrice: "$productInfo.purchasePrice"
            }
          }
        }
      },
      { $sort: { orderDate: -1 } }
    ]);

    // Calculate totals using the same formula as stats page
    let totalRevenue = 0;
    let totalProfit = 0;
    let ordersByStatus = {};

    orders.forEach(order => {
      totalRevenue += Number(order.orderTotal) || 0;
      
      const status = order.orderStatus || 'unknown';
      if (!ordersByStatus[status]) {
        ordersByStatus[status] = { count: 0, total: 0 };
      }
      ordersByStatus[status].count += 1;
      ordersByStatus[status].total += Number(order.orderTotal) || 0;

      // Calculate profit from order items (same formula as dashboard)
      if (order.orderItems && Array.isArray(order.orderItems)) {
        order.orderItems.forEach(item => {
          const salePrice = Number(item.salePrice) || 0;
          const purchasePrice = Number(item.purchasePrice) || 0;
          const quantity = Number(item.quantity) || 0;
          const itemProfit = (salePrice - purchasePrice) * quantity;
          totalProfit += itemProfit;
        });
      }
    });

    const totals = {
      totalRevenue,
      totalProfit,
      ordersByStatus,
      orderCount: orders.length,
      productCount: products.length
    };

    console.log("📊 Report API - Totals calculated:", {
      totalRevenue,
      totalProfit,
      orderCount: orders.length,
      productCount: products.length
    });

    return NextResponse.json({
      success: true,
      month: `${year}-${monthParam}`,
      products,
      orders,
      totals
    });

  } catch (error) {
    console.error("❌ Report API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
