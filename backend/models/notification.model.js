import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người nhận
    message: { type: String, required: true }, // Nội dung
    image: { type: String }, // Ảnh đính kèm (URL từ Cloudinary)
    isRead: { type: Boolean, default: false }, // Trạng thái đã xem
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;