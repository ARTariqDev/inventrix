import { connectDB, Order } from "@/models/models";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');

    // Convert userId to ObjectId for proper matching
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let matchCondition = { userId: userObjectId, isActive: true };
    
    // If search term is provided, search by recipient name (receivedBy field)
    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.trim();
      
      // Create regex pattern for recipient name search (case-insensitive)
      // This will match any part of the receivedBy field (first name, last name, or full name)
      const nameRegex = new RegExp(search, 'i');
      
      // Search in receivedBy field (which contains recipient names)
      matchCondition.receivedBy = nameRegex;
    }

    // Debug: Let's first check what orders exist
    const allOrders = await Order.find({ userId: userObjectId, isActive: true }).limit(3);
    console.log("🔍 Sample orders:", allOrders.map(order => ({
      orderId: order.orderId,
      receivedBy: order.receivedBy,
      address: order.address,
      phoneNumber: order.phoneNumber
    })));

    // Aggregate to get unique recipients with their order counts and total amounts
    const persons = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            recipient: "$receivedBy",
            address: "$address", 
            phoneNumber: "$phoneNumber"
          },
          orderCount: { $sum: 1 },
          totalAmount: { $sum: "$orderTotal" },
          totalCreditAmount: { $sum: "$creditAmount" },
          totalRemainingAmount: { $sum: "$remainingAmount" },
          creditOrdersCount: { 
            $sum: { 
              $cond: [{ $eq: ["$orderStatus", "credit"] }, 1, 0] 
            } 
          },
          lastOrderDate: { $max: "$orderDate" },
          firstOrderDate: { $min: "$orderDate" },
          orders: {
            $push: {
              orderId: "$orderId",
              orderDate: "$orderDate", 
              orderTotal: "$orderTotal",
              orderStatus: "$orderStatus",
              creditAmount: "$creditAmount",
              remainingAmount: "$remainingAmount",
              orderItems: "$orderItems"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          recipient: "$_id.recipient",
          address: "$_id.address",
          phoneNumber: "$_id.phoneNumber",
          orderCount: 1,
          totalAmount: 1,
          totalCreditAmount: 1,
          totalRemainingAmount: 1,
          creditOrdersCount: 1,
          lastOrderDate: 1,
          firstOrderDate: 1,
          orders: 1
        }
      },
      { $sort: { lastOrderDate: -1 } }
    ]);

    console.log("🔍 Persons API Debug:");
    console.log("- Match condition:", JSON.stringify(matchCondition, null, 2));
    console.log("- Found persons count:", persons.length);
    console.log("- Sample person:", persons[0] || "No persons found");

    return NextResponse.json({
      success: true,
      persons,
      count: persons.length
    });

  } catch (error) {
    console.error("GET Persons Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch persons" },
      { status: 500 }
    );
  }
}
