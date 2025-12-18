import mongoose from "mongoose";

const customerOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Lưu lại thông tin khách tại thời điểm đặt (tránh trường hợp user đổi profile sau này)
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
        size: String, // Lưu size nếu mua từ ContactModal
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Processed"], // Chờ xử lý, Đã xử lý
      default: "Pending",
    },
    note: String, // Ghi chú thêm nếu cần
  },
  { timestamps: true }
);

const CustomerOrder = mongoose.model("CustomerOrder", customerOrderSchema);
export default CustomerOrder;