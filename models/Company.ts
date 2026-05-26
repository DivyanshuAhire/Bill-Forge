import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  username: string;
  passwordHash: string;
  logo?: string;
  gstNumber: string;
  address: string;
  state: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  invoicePrefix: string;
  declaration?: string;
  signatureImage?: string;
  isActive: boolean;
  createdAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  companyName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  logo: { type: String },
  gstNumber: { type: String, required: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  bankName: { type: String },
  accountNumber: { type: String },
  ifsc: { type: String },
  invoicePrefix: { type: String, required: true },
  declaration: { type: String },
  signatureImage: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);
