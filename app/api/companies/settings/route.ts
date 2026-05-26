import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Company from "@/models/Company";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const company = await Company.findById(session.companyId);
    return NextResponse.json({ company });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const company = await Company.findByIdAndUpdate(session.companyId, { $set: body }, { new: true });
    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
