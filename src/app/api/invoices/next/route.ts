import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Invoice } from "@/models/Invoice";
import { User } from "@/models/User";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get user's prefix and default to company prefix "GM"
    const user = await User.findById(userId);
    const prefix = user?.invoicePrefix || "GM"; // Company prefix

    // Count existing invoices for this user
    const count = await Invoice.countDocuments({ userId });

    // Pad the number (e.g. 1 -> "001")
    const paddedNumber = String(count + 1).padStart(3, '0');

    // Compute year range (e.g., 26-27 for 2026-2027)
    const now = new Date();
    const year = now.getFullYear();
    const yearShort = (year % 100).toString().padStart(2, '0');
    const nextYearShort = ((year + 1) % 100).toString().padStart(2, '0');
    const yearRange = `${yearShort}-${nextYearShort}`;

    const cleanPrefix = prefix.replace(/[-\/]+$/, "");
    const nextInvoiceNo = `${cleanPrefix}/${yearRange}/${paddedNumber}`;

    return NextResponse.json({ nextInvoiceNo });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
