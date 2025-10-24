import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  size: { type: String, enum: ["S", "M", "L", "XL"], required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
});

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: { type: String },
    address: { type: String },
    phone: { type: String },
    items: [orderItemSchema],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["chưa giao", "đang giao", "đã giao"],
      default: "chưa giao"
    },
    receivedDate: Date,
    deliverDate: Date,
    paymentMethod: { type: String, enum: ["Chuyển khoản", "COD"], default: "COD" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
