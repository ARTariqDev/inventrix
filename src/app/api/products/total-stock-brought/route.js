import { connectDB, StockHistory } from "@/models/models";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }
    // Sum all stockAdded for this product (ensure ObjectId match)
    const result = await StockHistory.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: "$productId", totalStockBrought: { $sum: "$stockAdded" } } }
    ]);
    let totalStockBrought = result.length > 0 ? result[0].totalStockBrought : 0;
    let inferredUsed = false;
    // If no StockHistory, infer from orders and product stock
    if (totalStockBrought === 0) {
      // Get total sold from orders
      const Order = require("@/models/models").Order;
      const Product = require("@/models/models").Product;
      const totalSoldAgg = await Order.aggregate([
        { $unwind: "$orderItems" },
        { $match: { "orderItems.productId": new mongoose.Types.ObjectId(productId) } },
        { $group: { _id: null, totalSold: { $sum: "$orderItems.quantity" } } }
      ]);
      const totalSold = totalSoldAgg[0]?.totalSold || 0;
      // Get current stock from Product
      const productDoc = await Product.findById(productId).select("stock name");
      const currentStock = productDoc?.stock || 0;
      totalStockBrought = totalSold + currentStock;
      inferredUsed = true;
      console.log(`[TOTAL STOCK DEBUG] INFERRED for productId: ${productId} (${productDoc?.name || "unknown"})`);
      console.log(`[TOTAL STOCK DEBUG] totalSold: ${totalSold}`);
      console.log(`[TOTAL STOCK DEBUG] currentStock: ${currentStock}`);
      console.log(`[TOTAL STOCK DEBUG] inferred totalStockBrought: ${totalStockBrought}`);
    }
    console.log(`[TOTAL STOCK DEBUG] productId: ${productId}`);
    console.log(`[TOTAL STOCK DEBUG] aggregation result:`, JSON.stringify(result, null, 2));
    console.log(`[TOTAL STOCK DEBUG] totalStockBrought: ${totalStockBrought}`);
    return NextResponse.json({ productId, totalStockBrought, inferredUsed });
  } catch (error) {
    console.error("Error fetching total stock brought:", error);
    return NextResponse.json({ error: "Failed to fetch total stock brought" }, { status: 500 });
  }
}
