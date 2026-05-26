import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  role: { type: String, enum: ["SUPER_ADMIN", "COMPANY"], required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
  if (!MONGODB_URI) {
    console.error("Please define MONGODB_URI in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const username = "admin@billforge.com";
  const password = "admin123";

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    console.log("Admin user already exists");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const adminUser = new User({
    role: "SUPER_ADMIN",
    username,
    passwordHash,
  });

  await adminUser.save();
  console.log("Admin user created successfully");
  process.exit(0);
}

seed();
