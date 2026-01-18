import { connectDB, Order, Product, StockHistory } from "@/models/models";
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
      orderDate: { $gte: previousStartDate, $lte: previousEndDate }
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
      previousProfitData,
      // Unique customers (distinct phone numbers)
      uniqueCustomers
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
            totalValue: { $sum: { $multiply: ["$salePrice", "$stock"] } },
            avgPrice: { $avg: "$salePrice" }
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
              $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
            },
            ...(status !== "all" && { orderStatus: status })
          }
        },
        ...(category !== "all" ? [
          { $match: { "orderItems.productId": { $in: allProducts.filter(p => p.category === category).map(p => p._id) } } }
        ] : []),
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

      // Total profit calculation using historical order prices (with fallback to product lookup)
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
        {
          $addFields: {
            "orderItems.effectivePurchasePrice": {
              $cond: [
                { $gt: ["$orderItems.purchasePrice", 0] },
                "$orderItems.purchasePrice",
                { $ifNull: [{ $arrayElemAt: ["$productInfo.purchasePrice", 0] }, 0] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalCost: {
              $sum: {
                $multiply: ["$orderItems.effectivePurchasePrice", "$orderItems.quantity"]
              }
            },
            totalRevenue: {
              $sum: "$orderItems.itemTotal"
            }
          }
        },
        {
          $project: {
            _id: null,
            totalCost: 1,
            totalRevenue: 1,
            totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] }
          }
        }
      ]),

      // Previous period data for comparison
      Order.countDocuments(previousOrderFilter),

      Order.aggregate([
        { $match: previousOrderFilter },
        { $group: { _id: null, total: { $sum: "$orderTotal" } } }
      ]),

      // Previous period profit calculation using historical order prices (with fallback to product lookup)
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
        {
          $addFields: {
            "orderItems.effectivePurchasePrice": {
              $cond: [
                { $gt: ["$orderItems.purchasePrice", 0] },
                "$orderItems.purchasePrice",
                { $ifNull: [{ $arrayElemAt: ["$productInfo.purchasePrice", 0] }, 0] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalCost: {
              $sum: {
                $multiply: ["$orderItems.effectivePurchasePrice", "$orderItems.quantity"]
              }
            },
            totalRevenue: {
              $sum: "$orderItems.itemTotal"
            }
          }
        },
        {
          $project: {
            _id: null,
            totalCost: 1,
            totalRevenue: 1,
            totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] }
          }
        }
      ]),

      // Unique customers (distinct phone numbers from all orders, not filtered by date)
      Order.aggregate([
        { $match: { userId: userObjectId, isActive: true, phoneNumber: { $exists: true, $ne: "" } } },
        { $group: { _id: "$phoneNumber" } },
        { $count: "total" }
      ])
    ]);

    console.log("\n" + "=".repeat(80));
    console.log("🔍 STATS API RESULTS - DETAILED BREAKDOWN");
    console.log("=".repeat(80));
    
    console.log("\n📊 BASIC STATS:");
    console.log("- Total Orders:", totalOrders);
    console.log("- Total Revenue (from orderTotal):", totalRevenue[0]?.total || 0);
    console.log("- Daily Revenue entries:", dailyRevenue.length);
    console.log("- Status Distribution:", statusDistribution);
    
    console.log("\n💰 PROFIT CALCULATION BREAKDOWN:");
    console.log("- Total Revenue (from itemTotal):", profitData[0]?.totalRevenue || 0);
    console.log("- Total Cost (purchase prices):", profitData[0]?.totalCost || 0);
    console.log("- Total Profit (Revenue - Cost):", profitData[0]?.totalProfit || 0);
    console.log(`- Calculation: ${profitData[0]?.totalRevenue || 0} - ${profitData[0]?.totalCost || 0} = ${profitData[0]?.totalProfit || 0}`);
    
    console.log("\n📈 PREVIOUS PERIOD COMPARISON:");
    console.log("- Previous Orders:", previousOrders);
    console.log("- Previous Revenue:", previousRevenue[0]?.total || 0);
    console.log("- Previous Profit:", previousProfitData[0]?.totalProfit || 0);
    console.log("- Previous Cost:", previousProfitData[0]?.totalCost || 0);

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
      { $match: { userId: userObjectId, isActive: true } },
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
          },
          purchaseValue: {
            $sum: {
              $multiply: ["$purchasePrice", "$stock"]
            }
          }
        } 
      }
    ]);

    // Calculate monthly profit and spending for last 12 months
    // Spending is now based on stock additions (from StockHistory)
    // Profit is calculated from order revenue minus cost of goods sold
    
    // Get monthly revenue and profit from orders
    const monthlyRevenueProfit = await Order.aggregate([
      {
        $match: {
          userId: userObjectId,
          isActive: true,
          orderDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          },
          ...(status !== "all" && { orderStatus: status })
        }
      },
      ...(category !== "all" ? [
        { $match: { "orderItems.productId": { $in: allProducts.filter(p => p.category === category).map(p => p._id) } } }
      ] : []),
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.productId",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      {
        $addFields: {
          "orderItems.effectivePurchasePrice": {
            $cond: [
              { $gt: ["$orderItems.purchasePrice", 0] },
              "$orderItems.purchasePrice",
              { $ifNull: [{ $arrayElemAt: ["$productInfo.purchasePrice", 0] }, 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" }
          },
          totalCost: {
            $sum: {
              $multiply: ["$orderItems.effectivePurchasePrice", "$orderItems.quantity"]
            }
          },
          totalRevenue: {
            $sum: "$orderItems.itemTotal"
          }
        }
      },
      {
        $project: {
          _id: 1,
          totalCost: 1,
          totalRevenue: 1,
          totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Get monthly spending from stock additions (StockHistory)
    const monthlySpending = await StockHistory.aggregate([
      {
        $match: {
          userId: userObjectId,
          changeDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$changeDate" },
            month: { $month: "$changeDate" }
          },
          totalSpent: { $sum: "$totalCost" },
          totalStockAdded: { $sum: "$stockAdded" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Combine the two datasets
    const combinedMonthlyData = [];
    const now = new Date();
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      // Find revenue/profit data for this month
      const revenueData = monthlyRevenueProfit.find(item => 
        item._id.year === year && item._id.month === month
      );
      
      // Find spending data for this month
      const spendingData = monthlySpending.find(item => 
        item._id.year === year && item._id.month === month
      );
      
      combinedMonthlyData.push({
        _id: { year, month },
        totalRevenue: revenueData?.totalRevenue || 0,
        totalProfit: revenueData?.totalProfit || 0,
        totalSpent: spendingData?.totalSpent || 0,
        totalStockAdded: spendingData?.totalStockAdded || 0
      });
    }

    // Format monthly profit/spending data
    const monthlyProfitSpendingFormatted = combinedMonthlyData.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      year: item._id.year,
      monthNum: item._id.month,
      profit: item.totalProfit,
      spent: item.totalSpent,
      revenue: item.totalRevenue,
      stockAdded: item.totalStockAdded
    }));
    
    console.log("\n📅 MONTHLY DATA (Revenue/Profit from orders, Spending from stock additions):");
    console.log("Revenue/Profit data:", JSON.stringify(monthlyRevenueProfit, null, 2));
    console.log("Spending data (from StockHistory):", JSON.stringify(monthlySpending, null, 2));
    
    console.log("\n📊 FORMATTED MONTHLY DATA (Last 12 months):");
    monthlyProfitSpendingFormatted.forEach(month => {
      console.log(`\n${month.month}:`);
      console.log(`  Revenue: ${month.revenue}`);
      console.log(`  Spending (stock additions): ${month.spent}`);
      console.log(`  Stock Added: ${month.stockAdded} units`);
      console.log(`  Profit: ${month.profit}`);
    });
    
    console.log("\n" + "=".repeat(80));
    console.log("END OF STATS CALCULATION LOG");
    console.log("=".repeat(80) + "\n");

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalOrders,
          totalRevenue: currentRevenue,
          totalProducts,
          totalCustomers: uniqueCustomers[0]?.total || 0,
          avgOrderValue,
          totalProfit: currentProfit,
          profitMargin,
          totalStock: totalStock[0]?.total || 0,
          totalInventoryValue: totalInventoryValue[0]?.totalValue || 0,
          purchaseValuation: totalInventoryValue[0]?.purchaseValue || 0,
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
        monthlyProfitSpending: monthlyProfitSpendingFormatted,
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
