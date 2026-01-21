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

      // Total profit calculation: Sum of [(salePrice * qty) - (purchasePrice * qty)] - discountAmount per order
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
            "orderItems.effectivePurchasePrice": { $ifNull: [{ $arrayElemAt: ["$productInfo.purchasePrice", 0] }, 0] },
            "orderItems.itemMargin": {
              $subtract: [
                { $multiply: ["$orderItems.productPrice", "$orderItems.quantity"] },
                { $multiply: [
                  { $ifNull: [{ $arrayElemAt: ["$productInfo.purchasePrice", 0] }, 0] },
                  "$orderItems.quantity"
                ]}
              ]
            }
          }
        },
        {
          $group: {
            _id: "$_id",
            orderMargin: { $sum: "$orderItems.itemMargin" },
            discountAmount: { $first: "$discountAmount" }
          }
        },
        {
          $group: {
            _id: null,
            totalProfit: {
              $sum: {
                $subtract: ["$orderMargin", { $ifNull: ["$discountAmount", 0] }]
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

      // Previous period profit calculation: Sum of [(salePrice * qty) - (purchasePrice * qty)] - discountAmount per order
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
            "orderItems.effectivePurchasePrice": { $ifNull: [{ $arrayElemAt: ["$productInfo.purchasePrice", 0] }, 0] },
            "orderItems.itemMargin": {
              $subtract: [
                { $multiply: ["$orderItems.productPrice", "$orderItems.quantity"] },
                { $multiply: [
                  { $ifNull: [{ $arrayElemAt: ["$productInfo.purchasePrice", 0] }, 0] },
                  "$orderItems.quantity"
                ]}
              ]
            }
          }
        },
        {
          $group: {
            _id: "$_id",
            orderMargin: { $sum: "$orderItems.itemMargin" },
            discountAmount: { $first: "$discountAmount" }
          }
        },
        {
          $group: {
            _id: null,
            totalProfit: {
              $sum: {
                $subtract: ["$orderMargin", { $ifNull: ["$discountAmount", 0] }]
              }
            }
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

    // ========================================================================
    // DEBUG: Log all products and orders for this user in the current period
    // ========================================================================
    console.log("\n" + "=".repeat(80));
    console.log("📦 PRODUCTS LOG (All products for this user)");
    console.log("=".repeat(80));
    
    const allUserProducts = await Product.find({ userId: userObjectId, isActive: true })
      .select('name sku category purchasePrice salePrice stock')
      .sort({ name: 1 });
    
    console.log(`Total Products: ${allUserProducts.length}\n`);
    allUserProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Purchase Price: ${product.purchasePrice}`);
      console.log(`   Sale Price: ${product.salePrice}`);
      console.log(`   Stock: ${product.stock}`);
      console.log("");
    });

    console.log("\n" + "=".repeat(80));
    console.log("🧾 ORDERS LOG (Orders in current period: " + startDate.toISOString().split('T')[0] + " to " + endDate.toISOString().split('T')[0] + ")");
    console.log("=".repeat(80));
    
    const allUserOrders = await Order.find(orderFilter)
      .select('orderId orderDate orderStatus orderTotal orderItems receivedBy discountAmount')
      .sort({ orderDate: -1 });

    // ================= PROFIT LOG =====================
    console.log("\n=====\nprofit log\n=======\n");
    let totalProfitAllOrders = 0;
    const productProfitMap = {};
    allUserOrders.forEach((order, orderIdx) => {
      let orderProfit = 0;
      console.log(`Order #${orderIdx + 1}: ${order.orderId}`);
      order.orderItems.forEach((item, itemIdx) => {
        // Find product for this item
        const product = allUserProducts.find(p => p._id.toString() === (item.productId?.toString?.() || item.productId));
        let effectivePurchasePrice = item.purchasePrice;
        if (!effectivePurchasePrice || effectivePurchasePrice === 0) {
          effectivePurchasePrice = product ? product.purchasePrice : 0;
        }
        const purchaseTotal = (effectivePurchasePrice || 0) * (item.quantity || 0);
        const saleTotal = (item.productPrice || item.salePrice || 0) * (item.quantity || 0);
        const itemProfit = saleTotal - purchaseTotal;
        orderProfit += itemProfit;
        // Per-product profit
        if (!productProfitMap[item.productName]) {
          productProfitMap[item.productName] = { profit: 0, saleTotal: 0, purchaseTotal: 0, qty: 0 };
        }
        productProfitMap[item.productName].profit += itemProfit;
        productProfitMap[item.productName].saleTotal += saleTotal;
        productProfitMap[item.productName].purchaseTotal += purchaseTotal;
        productProfitMap[item.productName].qty += item.quantity || 0;
        console.log(`  Item #${itemIdx + 1}: ${item.productName}`);
        console.log(`    Purchase Total: ${purchaseTotal}`);
        console.log(`    Sale Total: ${saleTotal}`);
        console.log(`    Profit: ${itemProfit}`);
        if (!item.purchasePrice || item.purchasePrice === 0) {
          console.warn(`    ⚠️  Used product purchase price (${effectivePurchasePrice}) for item: ${item.productName}`);
        }
      });
      const discount = order.discountAmount || 0;
      orderProfit -= discount;
      totalProfitAllOrders += orderProfit;
      console.log(`  Discount: ${discount}`);
      console.log(`  Order Profit (after discount): ${orderProfit}`);
      console.log("");
    });
    console.log("---\nProfit per product:");
    Object.entries(productProfitMap).forEach(([name, data]) => {
      console.log(`Product: ${name}`);
      console.log(`  Total Sold: ${data.qty}`);
      console.log(`  Sale Total: ${data.saleTotal}`);
      console.log(`  Purchase Total: ${data.purchaseTotal}`);
      console.log(`  Profit: ${data.profit}`);
    });
    console.log("---\nTotal profit for all orders:", totalProfitAllOrders);
    console.log("====================================\n");
    
    // Restore summary totals calculation
    let totalOrderTotal = 0;
    let totalItemTotal = 0;
    let totalCostFromItems = 0;
    allUserOrders.forEach(order => {
      totalOrderTotal += order.orderTotal || 0;
      order.orderItems.forEach(item => {
        totalItemTotal += item.itemTotal || 0;
        totalCostFromItems += (item.purchasePrice || 0) * (item.quantity || 0);
      });
    });
    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY TOTALS");
    console.log("=".repeat(80));
    console.log(`Sum of all Order Totals (Revenue): ${totalOrderTotal}`);
    console.log(`Sum of all Item Totals (Undiscounted): ${totalItemTotal}`);
    console.log(`Sum of all Item Costs: ${totalCostFromItems}`);
    console.log(`Profit (OrderTotal - Cost): ${totalOrderTotal - totalCostFromItems}`);
    console.log(`Profit (ItemTotal - Cost): ${totalItemTotal - totalCostFromItems}`);
    console.log("=".repeat(80) + "\n");

    console.log("\n" + "=".repeat(80));
    console.log("🔍 STATS API RESULTS - DETAILED BREAKDOWN");
    console.log("=".repeat(80));
    
    console.log("\n📊 BASIC STATS:");
    console.log("- Total Orders:", totalOrders);
    console.log("- Total Revenue (from orderTotal):", totalRevenue[0]?.total || 0);
    console.log("- Daily Revenue entries:", dailyRevenue.length);
    console.log("- Status Distribution:", statusDistribution);
    
    console.log("\n💰 PROFIT CALCULATION BREAKDOWN:");
    console.log("- Total Revenue (from orderTotal):", totalRevenue[0]?.total || 0);
    console.log("- Total Profit (margin - discounts):", profitData[0]?.totalProfit || 0);
    
    console.log("\n📈 PREVIOUS PERIOD COMPARISON:");
    console.log("- Previous Orders:", previousOrders);
    console.log("- Previous Revenue:", previousRevenue[0]?.total || 0);
    console.log("- Previous Profit:", previousProfitData[0]?.totalProfit || 0);

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

    // Get spending for the current filtered period (for profit calculation)
    const currentPeriodSpending = await StockHistory.aggregate([
      {
        $match: {
          userId: userObjectId,
          changeDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      {
        $unwind: {
          path: "$productInfo",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: {
          "productInfo.isActive": true
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$totalCost" }
        }
      }
    ]);

    // Get previous period spending
    const previousPeriodSpending = await StockHistory.aggregate([
      {
        $match: {
          userId: userObjectId,
          changeDate: { $gte: previousStartDate, $lte: previousEndDate }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      {
        $unwind: {
          path: "$productInfo",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: {
          "productInfo.isActive": true
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$totalCost" }
        }
      }
    ]);

    // Calculate percentage changes
    const currentRevenue = totalRevenue[0]?.total || 0;
    const previousRevenueValue = previousRevenue[0]?.total || 0;
    const previousAvgOrderValue = previousOrders > 0 ? previousRevenueValue / previousOrders : 0;

    // Calculate profit metrics - profit is (salePrice * qty - purchasePrice * qty) - discount per order
    const currentSpending = currentPeriodSpending[0]?.totalSpent || 0;
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
    
    // Get monthly revenue from orders using orderTotal (includes discounts)
    const monthlyRevenue = await Order.aggregate([
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
          totalRevenue: {
            $sum: "$orderTotal"
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Get monthly profit from orders: Sum profit by order, then sum by month
    const monthlyProfit = await Order.aggregate([
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
          "orderItems.effectivePurchasePrice": { $ifNull: [{ $arrayElemAt: ["$productInfo.purchasePrice", 0] }, 0] },
          "orderItems.itemMargin": {
            $subtract: [
              { $multiply: [
                { $ifNull: ["$orderItems.productPrice", { $ifNull: ["$orderItems.salePrice", 0] }] },
                { $ifNull: ["$orderItems.quantity", 0] }
              ] },
              { $multiply: [
                { $ifNull: [{ $arrayElemAt: ["$productInfo.purchasePrice", 0] }, 0] },
                { $ifNull: ["$orderItems.quantity", 0] }
              ] }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$_id",
          orderDate: { $first: "$orderDate" },
          orderMargin: { $sum: "$orderItems.itemMargin" },
          discountAmount: { $first: "$discountAmount" }
        }
      },
      {
        $addFields: {
          orderProfit: { $subtract: ["$orderMargin", { $ifNull: ["$discountAmount", 0] }] },
          year: { $year: "$orderDate" },
          month: { $month: "$orderDate" }
        }
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalProfit: { $sum: "$orderProfit" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Combine monthly revenue and profit data
    const monthlyRevenueProfit = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const revenueEntry = monthlyRevenue.find(item => item._id.year === year && item._id.month === month);
      const profitEntry = monthlyProfit.find(item => item._id.year === year && item._id.month === month);

      const revenue = revenueEntry?.totalRevenue || 0;
      const profit = profitEntry?.totalProfit || 0;

      if (revenue > 0 || profit !== 0) {
        monthlyRevenueProfit.push({
          _id: { year, month },
          totalRevenue: revenue,
          totalProfit: profit
        });
      }
    }

    // Get monthly spending from stock additions (StockHistory) - only for active products
    const monthlySpending = await StockHistory.aggregate([
      {
        $match: {
          userId: userObjectId,
          changeDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      // Lookup to check if product is still active
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      // Unwind to access productInfo fields properly
      {
        $unwind: {
          path: "$productInfo",
          preserveNullAndEmptyArrays: false // Exclude if product doesn't exist
        }
      },
      // Only include stock history for products that are active
      {
        $match: {
          "productInfo.isActive": true
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

    // DEBUG: Log detailed spending breakdown for January
    const janSpendingDebug = await StockHistory.aggregate([
      {
        $match: {
          userId: userObjectId,
          changeDate: {
            $gte: new Date(2026, 0, 1),
            $lte: new Date(2026, 0, 31, 23, 59, 59)
          }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo"
        }
      }
    ]);

    console.log("\n" + "=".repeat(80));
    console.log("💸 JANUARY 2026 SPENDING BREAKDOWN (StockHistory entries)");
    console.log("=".repeat(80));
    janSpendingDebug.forEach((entry, index) => {
      const product = entry.productInfo[0];
      const isActive = product ? product.isActive : false;
      const productName = product ? product.name : "DELETED PRODUCT";
      console.log(`${index + 1}. ${productName} ${isActive ? '✅' : '❌ (inactive/deleted)'}`);
      console.log(`   Date: ${entry.changeDate}`);
      console.log(`   Stock Added: ${entry.stockAdded}, Total Cost: ${entry.totalCost}`);
      console.log(`   Product exists: ${product ? 'Yes' : 'No'}, isActive: ${isActive}`);
      console.log("");
    });
    console.log("=".repeat(80));

    // Combine the two datasets
    const combinedMonthlyData = [];
    
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
        totalProfit: revenueData?.totalProfit ?? 0,
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
