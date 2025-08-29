import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

/* -------------------- Counter Schema -------------------- */
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 } // start from 0, will increment to 1 for first item
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
      select: false, // don't return password by default
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

/* ✅ Pre-save hook to auto-generate user-specific SKU */
ProductSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Use user-specific counter ID
      const counterKey = `productId_${this.userId}`;
      
      // Auto-increment counter per user
      const counter = await Counter.findByIdAndUpdate(
        { _id: counterKey },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      // Generate SKU in format PROD00001
      this.sku = `PROD${String(counter.sequence_value).padStart(5, '0')}`;

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

/* -------------------- Order Schema -------------------- */
const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, uppercase: true },
    orderItems: [
      {
        productId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Product", 
          required: true 
        },
        productName: { type: String, required: true, trim: true },
        productPrice: { type: Number, required: true, min: 0 },
        quantity: { 
          type: Number, 
          required: true, 
          min: [1, "Quantity must be at least 1"],
          validate: {
            validator: Number.isInteger,
            message: "Quantity must be a whole number",
          }
        },
        itemTotal: { type: Number, required: true, min: 0 }
      }
    ],
    orderTotal: {
      type: Number,
      required: true,
      min: [0, "Order total cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0 && Number(v.toFixed(2)) === v;
        },
        message: "Order total must be a positive number with at most 2 decimal places",
      },
    },
    orderDate: { type: Date, default: Date.now },
    orderTime: { type: String, required: true },
    receivedBy: { type: String, required: true, trim: true, maxlength: 100 },
    orderStatus: { 
      type: String, 
      enum: ["confirmed", "shipped", "delivered"], 
      default: "confirmed" 
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true, trim: true, maxlength: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

OrderSchema.index({ orderId: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ orderDate: 1 });
OrderSchema.index({ isActive: 1 });

/* ✅ Pre-save hook to auto-generate user-specific Order ID */
OrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Use user-specific counter ID
      const counterKey = `orderId_${this.userId}`;
      
      // Auto-increment counter per user
      const counter = await Counter.findByIdAndUpdate(
        { _id: counterKey },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      // Generate Order ID in format ORD00001
      this.orderId = `ORD${String(counter.sequence_value).padStart(5, '0')}`;

      // Auto-populate userName if missing
      if (this.userId && !this.userName) {
        const User = mongoose.models.User || mongoose.model("User", UserSchema);
        const user = await User.findById(this.userId).select("fullName");
        if (user) this.userName = user.fullName;
      }

      // Set order time if not provided
      if (!this.orderTime) {
        const now = new Date();
        this.orderTime = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
      }

      // Calculate item totals and order total
      let calculatedTotal = 0;
      for (let item of this.orderItems) {
        item.itemTotal = item.productPrice * item.quantity;
        calculatedTotal += item.itemTotal;
      }
      this.orderTotal = calculatedTotal;

      next();
    } catch (error) {
      next(error);
    }
  } else {
    // If updating an existing order, recalculate totals if items changed
    if (this.isModified('orderItems')) {
      let calculatedTotal = 0;
      for (let item of this.orderItems) {
        item.itemTotal = item.productPrice * item.quantity;
        calculatedTotal += item.itemTotal;
      }
      this.orderTotal = calculatedTotal;
    }
    next();
  }
});

/* -------------------- Models -------------------- */
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

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



export { User, Product, Order, Counter };