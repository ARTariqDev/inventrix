import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0, min: 0 }
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
    sku: { type: String, uppercase: true },
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

ProductSchema.index({ sku: 1, userId: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ userId: 1 });

ProductSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counterKey = `productId_${this.userId}`;
      
      // Check if this is the user's first product
      const existingCounter = await Counter.findById(counterKey);
      
      let counter;
      if (!existingCounter) {
        // Create a new counter starting at 1 for this user
        counter = await Counter.findByIdAndUpdate(
          { _id: counterKey },
          { sequence_value: 1 },
          { new: true, upsert: true }
        );
      } else {
        // Increment existing counter
        counter = await Counter.findByIdAndUpdate(
          { _id: counterKey },
          { $inc: { sequence_value: 1 } },
          { new: true }
        );
      }

      // Generate SKU starting from PROD00001
      this.sku = `PROD${String(counter.sequence_value).padStart(5, '0')}`;

      if (this.userId && !this.userName) {
        const User = mongoose.models.User || mongoose.model("User", UserSchema);
        const user = await User.findById(this.userId).select("fullName");
        if (user) this.userName = user.fullName;
      }

      next();
    } catch (error) {
      console.error("Error in ProductSchema pre-save hook:", error);
      next(error);
    }
  } else {
    next();
  }
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: { 
      type: String, 
      uppercase: true,
      index: false  // Explicitly prevent automatic index creation
    },
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
  { 
    timestamps: true,
    autoIndex: false  // Disable automatic index creation
  }
);

// Only create the compound unique index we want
OrderSchema.index({ orderId: 1, userId: 1 }, { unique: true });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ orderDate: 1 });
OrderSchema.index({ isActive: 1 });

OrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderId) {
    try {
      const counterKey = `orderId_${this.userId}`;
      
      // Use a retry mechanism to handle potential conflicts
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          // Get current counter value without incrementing
          let counter = await Counter.findById(counterKey);
          if (!counter) {
            counter = await Counter.create({ _id: counterKey, sequence_value: 0 });
          }
          
          // Try the next sequence number
          const nextSequence = counter.sequence_value + 1;
          const orderId = `ORD${String(nextSequence).padStart(5, '0')}`;
          
          // Check if this orderId already exists for this user
          const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
          const existingOrder = await Order.findOne({ orderId, userId: this.userId });
          
          if (!existingOrder) {
            // Safe to use this orderId, now increment the counter
            await Counter.findByIdAndUpdate(
              counterKey,
              { $inc: { sequence_value: 1 } }
            );
            
            this.orderId = orderId;
            break;
          } else {
            // This orderId exists, increment the counter and try next
            await Counter.findByIdAndUpdate(
              counterKey,
              { $inc: { sequence_value: 1 } }
            );
          }
          
          attempts++;
        } catch (error) {
          console.error(`Attempt ${attempts + 1} failed for orderId generation:`, error);
          attempts++;
          
          if (attempts >= maxAttempts) {
            throw error;
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      if (!this.orderId) {
        throw new Error(`Failed to generate unique orderId after ${maxAttempts} attempts`);
      }

      if (this.userId && !this.userName) {
        const User = mongoose.models.User || mongoose.model("User", UserSchema);
        const user = await User.findById(this.userId).select("fullName");
        if (user) this.userName = user.fullName;
      }

      if (!this.orderTime) {
        const now = new Date();
        this.orderTime = now.toLocaleTimeString('en-US', { 
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