import { connectDB, Order, Product } from "@/models/models";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    await connectDB();

    // Get userId from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const category = searchParams.get("category") || "all";
    const status = searchParams.get("status") || "all";

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Base filters
    const orderFilter = { 
      userId, 
      isActive: true,
      orderDate: { $gte: startDate, $lte: endDate }
    };
    const productFilter = { userId, isActive: true };

    // Apply additional filters
    if (status !== "all") {
      orderFilter.orderStatus = status;
    }

    // Get all products for category filtering
    const allProducts = await Product.find(productFilter).select('_id category');
    
    if (category !== "all") {
      const categoryProductIds = allProducts
        .filter(p => p.category === category)
        .map(p => p._id);
      orderFilter["orderItems.productId"] = { $in: categoryProductIds };
      productFilter.category = category;
    }

    // Aggregate data
    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      lowStockProducts,
      recentOrders,
      topProducts,
      categoryStats,
      dailyRevenue,
      statusDistribution,
      monthlyTrends
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(orderFilter),

      // Total revenue
      Order.aggregate([
        { $match: orderFilter },
        { $group: { _id: null, total: { $sum: "$orderTotal" } } }
      ]),

      // Total products count
      Product.countDocuments(productFilter),

      // Low stock products (< 10)
      Product.find({ ...productFilter, stock: { $lt: 10 } })
        .select('name stock category')
        .sort({ stock: 1 })
        .limit(5),

      // Recent orders
      Order.find(orderFilter)
        .populate('orderItems.productId', 'name')
        .sort({ orderDate: -1 })
        .limit(5)
        .select('orderId orderTotal orderDate orderStatus receivedBy orderItems'),

      // Top selling products
      Order.aggregate([
        { $match: orderFilter },
        { $unwind: "$orderItems" },
        {
          $group: {
            _id: "$orderItems.productId",
            totalQuantity: { $sum: "$orderItems.quantity" },
            totalRevenue: { $sum: "$orderItems.itemTotal" },
            productName: { $first: "$orderItems.productName" }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ]),

      // Category statistics
      Product.aggregate([
        { $match: productFilter },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
            avgPrice: { $avg: "$price" }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Daily revenue for the period
      Order.aggregate([
        { $match: orderFilter },
        {
          $group: {
            _id: {
              year: { $year: "$orderDate" },
              month: { $month: "$orderDate" },
              day: { $dayOfMonth: "$orderDate" }
            },
            revenue: { $sum: "$orderTotal" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]),

      // Order status distribution
      Order.aggregate([
        { $match: orderFilter },
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
            revenue: { $sum: "$orderTotal" }
          }
        }
      ]),

      // Monthly trends (last 12 months)
      Order.aggregate([
        {
          $match: {
            userId,
            isActive: true,
            orderDate: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 11))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$orderDate" },
              month: { $month: "$orderDate" }
            },
            revenue: { $sum: "$orderTotal" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ])
    ]);

    // Format daily revenue data
    const dailyRevenueFormatted = dailyRevenue.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      revenue: item.revenue,
      orders: item.orders
    }));

    // Format monthly trends
    const monthlyTrendsFormatted = monthlyTrends.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      revenue: item.revenue,
      orders: item.orders
    }));

    // Calculate averages
    const avgOrderValue = totalOrders > 0 
      ? (totalRevenue[0]?.total || 0) / totalOrders 
      : 0;

    const totalStock = await Product.aggregate([
      { $match: productFilter },
      { $group: { _id: null, total: { $sum: "$stock" } } }
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalProducts,
          avgOrderValue,
          totalStock: totalStock[0]?.total || 0,
          lowStockCount: lowStockProducts.length
        },
        recentOrders,
        lowStockProducts,
        topProducts,
        categoryStats,
        dailyRevenue: dailyRevenueFormatted,
        statusDistribution,
        monthlyTrends: monthlyTrendsFormatted,
        filters: {
          period,
          category,
          status,
          availableCategories: [...new Set(allProducts.map(p => p.category))]
        }
      }
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
