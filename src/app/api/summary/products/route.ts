import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Invoice } from "@/models/Invoice";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Aggregate line items across all invoices for this user
    const pipeline = [
      { $match: { userId: { $oid: userId } } },
      { $unwind: "$lineItems" },
      {
        $group: {
          _id: "$lineItems.description",
          unitsSold: { $sum: "$lineItems.quantity" },
          totalRevenue: { $sum: "$lineItems.amount" },
        },
      },
      { $sort: { totalRevenue: -1 as const } },
      {
        $project: {
          _id: 0,
          name: "$_id",
          unitsSold: 1,
          totalRevenue: 1,
        },
      },
    ];

    // Use raw aggregation because userId is stored as ObjectId
    const mongoose = await import("mongoose");
    const results = await Invoice.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$lineItems" },
      {
        $group: {
          _id: "$lineItems.description",
          unitsSold: { $sum: "$lineItems.quantity" },
          totalRevenue: { $sum: "$lineItems.amount" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      {
        $project: {
          _id: 0,
          name: "$_id",
          unitsSold: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return NextResponse.json({ products: results });
  } catch (error: unknown) {
    console.error("Product summary API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
