import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  companyId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  customerId: mongoose.Types.ObjectId;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  roundoff: number;
  grandTotal: number;
  amountWords: string;
  pdfUrl?: string;
  createdAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  subtotal: { type: Number, required: true },
  cgstAmount: { type: Number, required: true },
  sgstAmount: { type: Number, required: true },
  roundoff: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  amountWords: { type: String, required: true },
  pdfUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
