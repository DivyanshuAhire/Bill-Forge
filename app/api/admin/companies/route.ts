import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Company from "@/models/Company";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const companies = await Company.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ companies });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Create Company
    const newCompany = new Company({
      companyName: body.companyName,
      ownerName: body.ownerName,
      email: body.email,
      phone: body.phone,
      username: body.username,
      passwordHash: await hashPassword(body.password),
      gstNumber: body.gstNumber,
      address: body.address,
      state: body.state,
      invoicePrefix: body.invoicePrefix,
      isActive: true,
    });
    
    await newCompany.save();

    // Create Company User
    const newUser = new User({
      companyId: newCompany._id,
      role: "COMPANY",
      username: body.username,
      passwordHash: newCompany.passwordHash,
    });

    await newUser.save();

    return NextResponse.json({ success: true, company: newCompany });
  } catch (error: any) {
    console.error("Create company error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
