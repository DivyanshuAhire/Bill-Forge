import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import InvoiceItem from "@/models/InvoiceItem";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const invoices = await Invoice.find({ companyId: session.companyId })
      .populate("customerId")
      .sort({ createdAt: -1 });
    return NextResponse.json({ invoices });
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
    
    // Auto increment invoice number logic could be complex. Here we just take it from frontend or simple count
    // A production app might use a separate sequence collection.
    const count = await Invoice.countDocuments({ companyId: session.companyId });
    // This expects prefix from frontend or fetches it here
    const invoiceNumber = body.invoiceNumber || `INV/${new Date().getFullYear()}/${count + 1}`;

    const newInvoice = new Invoice({
      companyId: session.companyId,
      invoiceNumber,
      invoiceDate: body.invoiceDate || new Date(),
      customerId: body.customerId,
      subtotal: body.subtotal,
      cgstAmount: body.cgstAmount,
      sgstAmount: body.sgstAmount,
      roundoff: body.roundoff,
      grandTotal: body.grandTotal,
      amountWords: body.amountWords,
      pdfUrl: body.pdfUrl || "",
    });

    await newInvoice.save();

    // Save items
    if (body.items && body.items.length > 0) {
      const itemsToSave = body.items.map((item: any) => ({
        invoiceId: newInvoice._id,
        productId: item.productId,
        qty: item.qty,
        rate: item.rate,
        amount: item.amount,
      }));
      await InvoiceItem.insertMany(itemsToSave);
    }

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
