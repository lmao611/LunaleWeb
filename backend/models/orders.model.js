import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Bỏ required: true
  name: { type: String }, // Thêm trường lưu tên sản phẩm thủ công
  size: { type: String, default: "" }, 
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
});

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Bỏ required: true
    customerName: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    items: [orderItemSchema],
    total: { type: Number, required: true, min: 0 },
    shipFee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["chưa giao", "đang giao", "đã giao", "đã hủy"],
      default: "chưa giao"
    },
    receivedDate: Date,
    deliverDate: Date,
    
    paymentMethod: { type: String, enum: ["Chuyển khoản", "COD", "Tiền mặt"], default: "COD" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);