import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Invoice } from "@/models/Invoice";
import { cookies } from "next/headers";
import { User } from "@/models/User";
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const invoices = await Invoice.find({ userId }).sort({ createdAt: -1, dated: -1 });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Ensure an invoice number exists – compute it if missing
    let invoiceNo = body.invoiceNo;
    if (!invoiceNo) {
      await connectToDatabase();
      const user = await User.findById(userId);
      const prefix = user?.invoicePrefix || "GM"; // Company prefix
      const count = await Invoice.countDocuments({ userId });
      const paddedNumber = String(count + 1).padStart(3, '0');
      const now = new Date();
      const year = now.getFullYear();
      const yearShort = (year % 100).toString().padStart(2, '0');
      const nextYearShort = ((year + 1) % 100).toString().padStart(2, '0');
      const yearRange = `${yearShort}-${nextYearShort}`;
      invoiceNo = `${prefix}/${yearRange}/${paddedNumber}`;
    }

    await connectToDatabase();
    const invoice = await Invoice.create({ ...body, invoiceNo, userId });
    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
    }

    await connectToDatabase();
    await Invoice.findOneAndDelete({ _id: id, userId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
