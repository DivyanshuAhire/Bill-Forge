import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILineItem {
  slNo: number;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  rate: number;
  rateUnit?: string;
  amount: number;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
}

export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  invoiceNo: string;
  dated: Date;
  deliveryNote?: string;
  modeTermsOfPayment?: string;
  referenceNoAndDate?: string;
  otherReferences?: string;
  buyersOrderNo?: string;
  buyersOrderDated?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
  consignee?: {
    companyName?: string;
    gstinUin?: string;
    stateName?: string;
    stateCode?: string;
  };
  buyer?: {
    companyName?: string;
    gstinUin?: string;
    stateName?: string;
    stateCode?: string;
  };
  lineItems: ILineItem[];
  totals: {
    subtotal: number;
    cgstTotal: number;
    sgstTotal: number;
    totalTax: number;
    roundOff: number;
    grandTotal: number;
    totalQuantity: number;
    amountInWords: string;
  };
}

const InvoiceSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invoiceNo: { type: String, required: true },
    dated: { type: Date, required: true, default: Date.now },
    deliveryNote: { type: String },
    modeTermsOfPayment: { type: String },
    referenceNoAndDate: { type: String },
    otherReferences: { type: String },
    buyersOrderNo: { type: String },
    buyersOrderDated: { type: String },
    dispatchDocNo: { type: String },
    deliveryNoteDate: { type: String },
    dispatchedThrough: { type: String },
    destination: { type: String },
    termsOfDelivery: { type: String },
    consignee: {
      companyName: { type: String },
      gstinUin: { type: String },
      stateName: { type: String },
      stateCode: { type: String },
    },
    buyer: {
      companyName: { type: String },
      gstinUin: { type: String },
      stateName: { type: String },
      stateCode: { type: String },
    },
    lineItems: [
      {
        slNo: { type: Number },
        description: { type: String },
        hsnSac: { type: String },
        quantity: { type: Number },
        unit: { type: String },
        rate: { type: Number },
        rateUnit: { type: String },
        amount: { type: Number },
        cgstRate: { type: Number },
        sgstRate: { type: Number },
        cgstAmount: { type: Number },
        sgstAmount: { type: Number },
      },
    ],
    totals: {
      subtotal: { type: Number },
      cgstTotal: { type: Number },
      sgstTotal: { type: Number },
      totalTax: { type: Number },
      roundOff: { type: Number },
      grandTotal: { type: Number },
      totalQuantity: { type: Number },
      amountInWords: { type: String },
    },
  },
  { timestamps: true }
);

export const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
