import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  userId: mongoose.Types.ObjectId;
  description: string;
  hsnSac?: string;
  unit?: string;
  rate?: number;
  cgstRate?: number;
  sgstRate?: number;
}

const ProductSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    hsnSac: { type: String },
    unit: { type: String },
    rate: { type: Number, default: 0 },
    cgstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
