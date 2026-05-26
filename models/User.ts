import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  companyId?: mongoose.Types.ObjectId;
  role: "SUPER_ADMIN" | "COMPANY";
  username: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  companyId: { type: Schema.Types.ObjectId, ref: "Company" },
  role: { type: String, enum: ["SUPER_ADMIN", "COMPANY"], required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
