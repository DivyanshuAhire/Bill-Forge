import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  gstNumber?: string;
  address?: string;
  state?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  gstNumber: { type: String },
  address: { type: String },
  state: { type: String },
  phone: { type: String },
  email: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
