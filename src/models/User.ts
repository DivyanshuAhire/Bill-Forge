import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  phoneNumber: string;
  invoicePrefix?: string;
  companyName?: string;
  logoUrl?: string;
  bankLogoUrl?: string; // New field for bank details image
  addressLines?: string[];
  gstinUin?: string;
  stateName?: string;
  stateCode?: string;
  email?: string;
  templateName?: string; // PDF template selection
  bankDetails?: {
    bankName?: string;
    accountNo?: string;
    branch?: string;
    ifscCode?: string;
  };
  footer?: {
    declaration?: string;
    eoAndE?: string;
    signatoryLabel?: string;
    signatoryTitle?: string;
    jurisdictionNote?: string;
    computerGeneratedNote?: string;
  };
}

const UserSchema: Schema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    invoicePrefix: { type: String, default: "INV-" },
    companyName: { type: String },
    logoUrl: { type: String },
    bankLogoUrl: { type: String },
    addressLines: { type: [String] },
    gstinUin: { type: String },
    stateName: { type: String },
    stateCode: { type: String },
    email: { type: String },
    templateName: { type: String, default: "default" },
    bankDetails: {
      bankName: { type: String },
      accountNo: { type: String },
      branch: { type: String },
      ifscCode: { type: String }
    },
    footer: {
      declaration: { type: String },
      eoAndE: { type: String },
      signatoryLabel: { type: String },
      signatoryTitle: { type: String },
      jurisdictionNote: { type: String },
      computerGeneratedNote: { type: String }
    }
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
