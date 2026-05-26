import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const customers = await Customer.find({ companyId: session.companyId }).sort({ createdAt: -1 });
    return NextResponse.json({ customers });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    
    const newCustomer = new Customer({
      companyId: session.companyId,
      ...body,
    });

    await newCustomer.save();
    return NextResponse.json({ success: true, customer: newCustomer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
