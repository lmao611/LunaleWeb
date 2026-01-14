import mongoose from "mongoose";

const customerOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerInfo: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        image: String,
        price: Number,
        quantity: { type: Number, default: 1 },
        size: String,
      },
    ],
    totalAmount: { type: Number, required: true },
    
    paymentMethod: { 
        type: String, 
        enum: ["COD", "Chuyển khoản", "Tiền mặt"],
        default: "COD" 
    },
    status: {
      type: String,
      enum: ["Pending", "Processed", "Cancelled"], 
      default: "Pending",
    },
    note: String,
  },
  { timestamps: true }
);

const CustomerOrder = mongoose.model("CustomerOrder", customerOrderSchema);
export default CustomerOrder;