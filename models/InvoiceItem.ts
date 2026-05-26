import mongoose, { Schema, Document } from "mongoose";

export interface IInvoiceItem extends Document {
  invoiceId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  qty: number;
  rate: number;
  amount: number;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

export default mongoose.models.InvoiceItem || mongoose.model<IInvoiceItem>("InvoiceItem", InvoiceItemSchema);
