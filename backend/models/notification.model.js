import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    image: { type: String },
    isRead: { type: Boolean, default: false },
    
    // --- THÊM 2 TRƯỜNG NÀY ---
    type: { type: String, enum: ["message", "order", "system"], default: "system" }, 
    relatedId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Lưu ID người gửi (nếu là tin nhắn) hoặc ID đơn hàng
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;