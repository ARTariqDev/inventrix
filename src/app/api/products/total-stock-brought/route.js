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
    const totalStockBrought = result.length > 0 ? result[0].totalStockBrought : 0;
    return NextResponse.json({ productId, totalStockBrought });
  } catch (error) {
    console.error("Error fetching total stock brought:", error);
    return NextResponse.json({ error: "Failed to fetch total stock brought" }, { status: 500 });
  }
}
