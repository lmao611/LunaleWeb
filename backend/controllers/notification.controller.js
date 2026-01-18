import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js"; // Giả định bạn đã có file cấu hình này như trong cấu trúc ảnh cũ

export const sendNotification = async (req, res) => {
  try {
    const { userId, message, sendToAll } = req.body;
    const imageFile = req.file; // Lấy ảnh từ middleware upload

    let imageUrl = "";
    if (imageFile) {
      // Upload ảnh lên Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(imageFile.path, {
        folder: "notifications",
      });
      imageUrl = uploadResponse.secure_url;
    }

    if (sendToAll === "true" || sendToAll === true) {
      // 1. Gửi cho TOÀN BỘ user (trừ admin/controller nếu muốn, ở đây gửi hết cho role customer)
      const customers = await User.find({ role: "customer" });
      
      const notifications = customers.map((customer) => ({
        recipient: customer._id,
        message,
        image: imageUrl,
      }));

      await Notification.insertMany(notifications);
      return res.status(201).json({ message: `Đã gửi thông báo đến ${customers.length} khách hàng.` });

    } else {
      // 2. Gửi cho 1 người cụ thể
      if (!userId) return res.status(400).json({ message: "Vui lòng chọn khách hàng." });

      const notification = await Notification.create({
        recipient: userId,
        message,
        image: imageUrl,
      });
      return res.status(201).json(notification);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Lỗi server khi gửi thông báo." });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    // Lấy thông báo của chính user đang đăng nhập
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }); // Mới nhất lên đầu
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách thông báo." });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái." });
  }
};

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndDelete(id);
        res.json({ message: "Đã xóa thông báo" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xóa thông báo" });
    }
}