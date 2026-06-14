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
    
    // Get user's prefix
    const user = await User.findById(userId);
    const prefix = user?.invoicePrefix || "INV-";

    // Count existing invoices for this user
    const count = await Invoice.countDocuments({ userId });
    
    // Pad the number (e.g. 1 -> "001")
    const paddedNumber = String(count + 1).padStart(3, '0');
    
    const nextInvoiceNo = `${prefix}${paddedNumber}`;

    return NextResponse.json({ nextInvoiceNo });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
