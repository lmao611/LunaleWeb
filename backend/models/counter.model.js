import mongoose from "mongoose";

/**
 * Bộ đếm nguyên tử dùng để sinh orderId tuần tự.
 * Tránh lỗi trùng số đơn khi hai khách đặt hàng cùng lúc.
 */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
