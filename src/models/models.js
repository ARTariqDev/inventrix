import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

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
      select: false,
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

const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, required: true, trim: true, maxlength: 50 },
    purchasePrice: {
      type: Number,
      required: true,
      min: [0, "Purchase price cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0 && Number(v.toFixed(2)) === v;
        },
        message: "Purchase price must be a positive number with at most 2 decimal places",
      },
    },
    salePrice: {
      type: Number,
      required: true,
      min: [0, "Sale price cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0 && Number(v.toFixed(2)) === v;
        },
        message: "Sale price must be a positive number with at most 2 decimal places",
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

ProductSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counterKey = `productId_${this.userId}`;
      
      const counter = await Counter.findByIdAndUpdate(
        { _id: counterKey },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      this.sku = `PROD${String(counter.sequence_value).padStart(5, '0')}`;

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
        purchasePrice: { type: Number, default: 0, min: 0 },
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
    subtotal: {
      type: Number,
      default: 0,
      min: [0, "Subtotal cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0 && Number(v.toFixed(2)) === v;
        },
        message: "Subtotal must be a positive number with at most 2 decimal places",
      },
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0 && Number(v.toFixed(2)) === v;
        },
        message: "Discount amount must be a positive number with at most 2 decimal places",
      },
    },
    orderDate: { type: Date, default: Date.now },
    orderTime: { type: String, required: true },
    receivedBy: { type: String, required: true, trim: true, maxlength: 100 },
    address: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 500,
      default: ""
    },
    phoneNumber: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 20,
      default: ""
    },
    orderStatus: { 
      type: String, 
      enum: ["confirmed", "shipped", "delivered", "cancelled", "credit"], 
      default: "confirmed" 
    },
    creditAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0 && Number(v.toFixed(2)) === v;
        },
        message: "Paid amount must be a positive number with at most 2 decimal places",
      },
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, "Credit amount cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0 && Number(v.toFixed(2)) === v;
        },
        message: "Credit amount must be a positive number with at most 2 decimal places",
      },
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

OrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counterKey = `orderId_${this.userId}`;
      
      const counter = await Counter.findByIdAndUpdate(
        { _id: counterKey },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      this.orderId = `ORD${String(counter.sequence_value).padStart(5, '0')}`;

      if (this.userId && !this.userName) {
        const User = mongoose.models.User || mongoose.model("User", UserSchema);
        const user = await User.findById(this.userId).select("fullName");
        if (user) this.userName = user.fullName;
      }

      if (!this.orderTime) {
        const now = new Date();
        this.orderTime = now.toLocaleTimeString([], { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
      }

      let calculatedTotal = 0;
      for (let item of this.orderItems) {
        item.itemTotal = item.productPrice * item.quantity;
        calculatedTotal += item.itemTotal;
      }
      
      // Set subtotal and calculate final total with discount
      this.subtotal = calculatedTotal;
      const discountAmount = this.discountAmount || 0;
      this.orderTotal = Math.max(0, calculatedTotal - discountAmount);

      // Calculate credit amount (remaining to be paid) if status is credit
      if (this.orderStatus === 'credit') {
        this.remainingAmount = Math.max(0, this.orderTotal - (this.creditAmount || 0));
      } else {
        this.creditAmount = 0;
        this.remainingAmount = 0;
      }

      next();
    } catch (error) {
      next(error);
    }
  } else {
    if (this.isModified('orderItems') || this.isModified('creditAmount') || this.isModified('orderStatus') || this.isModified('discountAmount')) {
      let calculatedTotal = 0;
      for (let item of this.orderItems) {
        item.itemTotal = item.productPrice * item.quantity;
        calculatedTotal += item.itemTotal;
      }
      
      // Set subtotal and calculate final total with discount
      this.subtotal = calculatedTotal;
      const discountAmount = this.discountAmount || 0;
      this.orderTotal = Math.max(0, calculatedTotal - discountAmount);

      // Calculate credit amount (remaining to be paid) if status is credit
      if (this.orderStatus === 'credit') {
        this.remainingAmount = Math.max(0, this.orderTotal - (this.creditAmount || 0));
      } else {
        this.creditAmount = 0;
        this.remainingAmount = 0;
      }
    }
    next();
  }
});

// Stock History Schema - tracks stock additions/changes for spending calculation
const StockHistorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    previousStock: { type: Number, required: true, default: 0 },
    newStock: { type: Number, required: true },
    stockAdded: { type: Number, required: true }, // Only positive values (additions)
    purchasePrice: { type: Number, required: true }, // Purchase price at time of addition
    totalCost: { type: Number, required: true }, // stockAdded * purchasePrice
    changeType: { type: String, enum: ["create", "update"], required: true },
    changeDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StockHistorySchema.index({ userId: 1, changeDate: 1 });
StockHistorySchema.index({ productId: 1 });
StockHistorySchema.index({ changeDate: 1 });

// Monthly Statistics Snapshot Schema
const MonthlySnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true, trim: true },
    month: { type: Number, required: true, min: 1, max: 12 }, // 1-12
    year: { type: Number, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    
    // Overview Statistics
    overview: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalProducts: { type: Number, default: 0 },
      avgOrderValue: { type: Number, default: 0 },
      totalProfit: { type: Number, default: 0 },
      profitMargin: { type: Number, default: 0 },
      totalStock: { type: Number, default: 0 },
      totalInventoryValue: { type: Number, default: 0 },
      lowStockCount: { type: Number, default: 0 },
    },
    
    // Top Products (top 10)
    topProducts: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      productName: { type: String },
      totalQuantity: { type: Number },
      totalRevenue: { type: Number }
    }],
    
    // Category Statistics
    categoryStats: [{
      category: { type: String },
      count: { type: Number },
      totalValue: { type: Number },
      avgPrice: { type: Number }
    }],
    
    // Status Distribution
    statusDistribution: [{
      status: { type: String },
      count: { type: Number },
      revenue: { type: Number }
    }],
    
    // Daily Revenue for the month
    dailyRevenue: [{
      date: { type: String },
      revenue: { type: Number },
      orders: { type: Number }
    }],
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index to ensure one snapshot per user per month/year
MonthlySnapshotSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });
MonthlySnapshotSchema.index({ userId: 1, periodStart: 1 });
MonthlySnapshotSchema.index({ userId: 1, isActive: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
const StockHistory = mongoose.models.StockHistory || mongoose.model("StockHistory", StockHistorySchema);
const MonthlySnapshot = mongoose.models.MonthlySnapshot || mongoose.model("MonthlySnapshot", MonthlySnapshotSchema);

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables. Check your .env file and dotenv config.");
  }
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



export { User, Product, Order, Counter, StockHistory, MonthlySnapshot };