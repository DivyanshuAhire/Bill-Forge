import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  hsnCode?: string;
  unit: string;
  rate: number;
  cgstPercent: number;
  sgstPercent: number;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  hsnCode: { type: String },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  cgstPercent: { type: Number, required: true },
  sgstPercent: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
