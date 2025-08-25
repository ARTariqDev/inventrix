import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

/* -------------------- Counter Schema -------------------- */
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 11000 } // start from 11000
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/* -------------------- User Schema -------------------- */
const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // don’t return password by default
    },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ fullName: 1 });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* -------------------- Product Schema -------------------- */
const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, required: true, trim: true, maxlength: 50 },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0 && Number(v.toFixed(2)) === v;
        },
        message: "Price must be a positive number with at most 2 decimal places",
      },
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true, trim: true, maxlength: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ sku: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ userId: 1 });

/* ✅ Pre-save hook to auto-generate SKU and set userName */
ProductSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Auto-increment counter
      const counter = await Counter.findByIdAndUpdate(
        { _id: "productId" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      // Generate SKU in format PRODXXXXX
      this.sku = `PROD${String(counter.sequence_value)}`;

      // Auto-populate userName if missing
      if (this.userId && !this.userName) {
        const User = mongoose.models.User || mongoose.model("User", UserSchema);
        const user = await User.findById(this.userId).select("fullName");
        if (user) this.userName = user.fullName;
      }

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

/* -------------------- Models -------------------- */
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

/* -------------------- DB Connection -------------------- */
export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || "myapp",
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

export { User, Product };
