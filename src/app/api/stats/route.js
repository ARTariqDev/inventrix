import { connectDB, Order, Product } from "@/models/models";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    console.log("🔍 Stats API - userId from cookie:", userId);
    
    if (!userId) {
      console.log("❌ Stats API - No userId found in cookie");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const category = searchParams.get("category") || "all";
    const status = searchParams.get("status") || "all";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let endDate, startDate;
    if (startDateParam && endDateParam) {
      // Use provided date range
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      // Set endDate to end of day
      endDate.setHours(23,59,59,999);
    } else if (period) {
      // Use period if specified
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
    } else {
      // Default to current month (1st to today)
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const orderFilter = { 
      userId: userObjectId, 
      isActive: true,
      orderDate: { $gte: startDate, $lte: endDate }
    };
    const productFilter = { userId: userObjectId, isActive: true };
    
    console.log("🔍 Stats API - orderFilter:", JSON.stringify(orderFilter, null, 2));
    console.log("🔍 Stats API - Date range:", startDate.toISOString(), "to", endDate.toISOString());

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

    // Setup previous period for comparison
    // Previous period logic for custom date range
    let previousStartDate, previousEndDate;
    if (startDateParam && endDateParam) {
      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - diffDays);
    } else if (period) {
      previousStartDate = new Date(startDate);
      previousEndDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - parseInt(period));
    } else {
      // Default: compare with previous month period
      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - diffDays);
    }
    
    const previousOrderFilter = {
      userId: userObjectId,
      isActive: true,
      orderDate: { $gte: previousStartDate, $lt: previousEndDate }
    };

    if (status !== "all") {
      previousOrderFilter.orderStatus = status;
    }

    if (category !== "all") {
      const categoryProductIds = allProducts
        .filter(p => p.category === category)
        .map(p => p._id);
      previousOrderFilter["orderItems.productId"] = { $in: categoryProductIds };
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
      monthlyTrends,
      profitData,
      // Previous period data for comparison
      previousOrders,
      previousRevenue,
      previousProfitData
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
            userId: userObjectId,
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
      ]),

      // Total profit calculation
      Order.aggregate([
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
            _id: null,
            totalProfit: {
              $sum: {
                $multiply: [
                  { $subtract: ["$productInfo.salePrice", "$productInfo.purchasePrice"] },
                  "$orderItems.quantity"
                ]
              }
            },
            totalCost: {
              $sum: {
                $multiply: ["$productInfo.purchasePrice", "$orderItems.quantity"]
              }
            },
            totalRevenue: {
              $sum: {
                $multiply: ["$productInfo.salePrice", "$orderItems.quantity"]
              }
            }
          }
        }
      ]),

      // Previous period data for comparison
      Order.countDocuments(previousOrderFilter),

      Order.aggregate([
        { $match: previousOrderFilter },
        { $group: { _id: null, total: { $sum: "$orderTotal" } } }
      ]),

      // Previous period profit calculation
      Order.aggregate([
        { $match: previousOrderFilter },
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
            _id: null,
            totalProfit: {
              $sum: {
                $multiply: [
                  { $subtract: ["$productInfo.salePrice", "$productInfo.purchasePrice"] },
                  "$orderItems.quantity"
                ]
              }
            }
          }
        }
      ])
    ]);

    console.log("🔍 Stats API Results:");
    console.log("- Total Orders:", totalOrders);
    console.log("- Total Revenue result:", totalRevenue);
    console.log("- Total Revenue value:", totalRevenue[0]?.total || 0);
    console.log("- Daily Revenue entries:", dailyRevenue.length);
    console.log("- Status Distribution entries:", statusDistribution.length);
    console.log("- Status Distribution:", statusDistribution);

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

    // Calculate percentage changes
    const currentRevenue = totalRevenue[0]?.total || 0;
    const previousRevenueValue = previousRevenue[0]?.total || 0;
    const previousAvgOrderValue = previousOrders > 0 ? previousRevenueValue / previousOrders : 0;

    // Calculate profit metrics
    const currentProfit = profitData[0]?.totalProfit || 0;
    const previousProfitValue = previousProfitData[0]?.totalProfit || 0;
    const profitMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenueChange = calculateChange(currentRevenue, previousRevenueValue);
    const ordersChange = calculateChange(totalOrders, previousOrders);
    const avgOrderValueChange = calculateChange(avgOrderValue, previousAvgOrderValue);
    const profitChange = calculateChange(currentProfit, previousProfitValue);

    const totalStock = await Product.aggregate([
      { $match: productFilter },
      { $group: { _id: null, total: { $sum: "$stock" } } }
    ]);

    // Calculate total inventory value (cost of all stock)
    const totalInventoryValue = await Product.aggregate([
      { $match: { userId: userObjectId, isActive: true } }, // Don't filter by category for inventory value
      { 
        $group: { 
          _id: null, 
          totalValue: { 
            $sum: { 
              $multiply: ["$salePrice", "$stock"]  //changed to use sale price
            } 
          } 
        } 
      }
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalOrders,
          totalRevenue: currentRevenue,
          totalProducts,
          avgOrderValue,
          totalProfit: currentProfit,
          profitMargin,
          totalStock: totalStock[0]?.total || 0,
          totalInventoryValue: totalInventoryValue[0]?.totalValue || 0,
          lowStockCount: lowStockProducts.length,
          // Percentage changes
          revenueChange,
          ordersChange,
          avgOrderValueChange,
          profitChange,
          productsChange: 0 // Products don't change much period to period
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
