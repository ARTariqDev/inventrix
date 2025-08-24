import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";


dotenv.config();


const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);


const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

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
    },

    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user'
    },

    isActive: {
      type: Boolean,
      default: true
    }
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
    sku: {
      type: String,
      unique: true,
      required: true,
      uppercase: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function(v) {
          return v >= 0 && Number(v.toFixed(2)) === v;
        },
        message: 'Price must be a positive number with at most 2 decimal places'
      }
    },

    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be a whole number'
      }
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);


ProductSchema.index({ sku: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ isActive: 1 });

// Auto-generate SKU before saving
ProductSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "productId" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      
      this.sku = `PROD${String(counter.sequence_value).padStart(5, "0")}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});


const OrderItemSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    ref: "Product"
  },
  
  productName: {
    type: String,
    required: true
  },
  
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  
  itemTotal: {
    type: Number,
    required: true,
    min: [0, 'Item total cannot be negative']
  }
}, { _id: false });


OrderItemSchema.pre("validate", function() {
  if (this.quantity && this.unitPrice) {
    this.itemTotal = Number((this.quantity * this.unitPrice).toFixed(2));
  }
});


const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
      uppercase: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      match: [/.+\@.+\..+/, "Please fill a valid email address"]
    },

    orderDetails: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'Order must contain at least one item'
      }
    },

    orderTotal: {
      type: Number,
      required: true,
      min: [0, 'Order total cannot be negative']
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },

    shippingAddress: {
      street: { type: String, required: true, maxlength: 200 },
      city: { type: String, required: true, maxlength: 50 },
      state: { type: String, required: true, maxlength: 50 },
      zipCode: { type: String, required: true, maxlength: 20 },
      country: { type: String, required: true, maxlength: 50, default: 'Pakistan' }
    },

    notes: {
      type: String,
      maxlength: 500
    }
  },
  { timestamps: true }
);


OrderSchema.index({ orderId: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });


OrderSchema.pre("save", async function (next) {
  try {

    if (this.isNew) {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "orderId" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      
      this.orderId = `ORD${String(counter.sequence_value).padStart(6, "0")}`;
    }


    if (this.orderDetails && this.orderDetails.length > 0) {
      this.orderTotal = Number(
        this.orderDetails.reduce((total, item) => total + item.itemTotal, 0).toFixed(2)
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});


OrderSchema.methods.validateAndUpdateStock = async function () {
  const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
  

  for (const item of this.orderDetails) {
    const product = await Product.findOne({ sku: item.sku, isActive: true });
    if (!product) {
      throw new Error(`Product with SKU ${item.sku} not found`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.sku}. Available: ${product.stock}, Required: ${item.quantity}`);
    }
    

    item.productName = product.name;
    item.unitPrice = product.price;
  }


  for (const item of this.orderDetails) {
    await Product.findOneAndUpdate(
      { sku: item.sku },
      { $inc: { stock: -item.quantity } }
    );
  }
};


const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);


export const createUser = async (userData) => {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
};

export const createProduct = async (productData) => {
  try {
    const product = new Product(productData);
    return await product.save();
  } catch (error) {
    throw new Error(`Error creating product: ${error.message}`);
  }
};

export const createOrder = async (orderData) => {
  try {
    const order = new Order(orderData);
    

    await order.validateAndUpdateStock();
    

    return await order.save();
  } catch (error) {
    throw new Error(`Error creating order: ${error.message}`);
  }
};


export const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      return;
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};


export { User, Product, Order, Counter };

