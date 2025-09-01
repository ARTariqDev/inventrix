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
      enum: ["confirmed", "shipped", "delivered", "cancelled"], 
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
      this.orderTotal = calculatedTotal;

      next();
    } catch (error) {
      next(error);
    }
  } else {
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

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

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