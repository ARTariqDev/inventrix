import { connectDB, Order, Product, StockHistory } from "@/models/models";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const productIds = searchParams.get("productIds")?.split(",").filter(Boolean) || [];
    const ids = productId ? [productId] : productIds;
    if (ids.length === 0 || ids.some((id) => !mongoose.isValidObjectId(id))) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const result = await StockHistory.aggregate([
      { $match: { productId: { $in: objectIds } } },
      { $group: { _id: "$productId", totalStockBrought: { $sum: "$stockAdded" } } }
    ]);

    const totals = Object.fromEntries(ids.map((id) => [id, 0]));
    for (const entry of result) {
      totals[entry._id.toString()] = entry.totalStockBrought;
    }

    const missingIds = objectIds.filter((id) => totals[id.toString()] === 0);
    if (missingIds.length > 0) {
      const [soldTotals, products] = await Promise.all([
        Order.aggregate([
          { $unwind: "$orderItems" },
          { $match: { "orderItems.productId": { $in: missingIds } } },
          { $group: { _id: "$orderItems.productId", totalSold: { $sum: "$orderItems.quantity" } } }
        ]),
        Product.find({ _id: { $in: missingIds } }).select("_id stock").lean()
      ]);
      const soldByProduct = Object.fromEntries(
        soldTotals.map((entry) => [entry._id.toString(), entry.totalSold])
      );
      for (const product of products) {
        const id = product._id.toString();
        totals[id] = (soldByProduct[id] || 0) + (product.stock || 0);
      }
    }

    if (productId) {
      return NextResponse.json({
        productId,
        totalStockBrought: totals[productId],
        inferredUsed: missingIds.some((id) => id.toString() === productId)
      });
    }
    return NextResponse.json({ totals });
  } catch (error) {
    console.error("Error fetching total stock brought:", error);
    return NextResponse.json({ error: "Failed to fetch total stock brought" }, { status: 500 });
  }
}
