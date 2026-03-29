import mongoose from "mongoose";

const customerOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // SỬA Ở ĐÂY: Chuyển thành false để cho phép khách vãng lai mua hàng
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
    
    // Phương thức thanh toán
    paymentMethod: { 
        type: String, 
        enum: ["COD", "Chuyển khoản", "Tiền mặt"],
        default: "COD" 
    },
    // Trạng thái đã thanh toán (khi khách bấm "Tôi đã thanh toán")
    isPaid: { type: Boolean, default: false }, 
    
    status: {
      type: String,
      enum: ["Pending", "Processed", "Cancelled"], 
      default: "Pending",
    },
    note: String,

    // --- MÃ ĐƠN HÀNG TỰ TĂNG (VD: 1, 2, 3...) ---
    orderId: { type: Number, unique: true },
  },
  { timestamps: true }
);

const CustomerOrder = mongoose.model("CustomerOrder", customerOrderSchema);
export default CustomerOrder;