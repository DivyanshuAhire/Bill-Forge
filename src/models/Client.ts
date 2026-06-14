import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClient extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  gstinUin?: string;
  stateName?: string;
  stateCode?: string;
  addressLines?: string[];
}

const ClientSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true },
    gstinUin: { type: String },
    stateName: { type: String },
    stateCode: { type: String },
    addressLines: { type: [String] },
  },
  { timestamps: true }
);

export const Client: Model<IClient> = mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);
