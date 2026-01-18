import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js"; // IMPORT QUAN TRỌNG

export const sendNotification = async (req, res) => {
  try {
    const { userId, message, sendToAll } = req.body;
    const imageFile = req.file;

    let imageUrl = "";
    if (imageFile) {
      const uploadResponse = await cloudinary.uploader.upload(imageFile.path, {
        folder: "notifications",
      });
      imageUrl = uploadResponse.secure_url;
    }

    if (sendToAll === "true" || sendToAll === true) {
      // 1. Gửi cho tất cả khách hàng
      const customers = await User.find({ role: "customer" });
      
      const notifications = customers.map((customer) => ({
        recipient: customer._id,
        message,
        image: imageUrl,
      }));

      await Notification.insertMany(notifications);
      
      // --- SOCKET: BẮN TIN CHO TẤT CẢ ---
      io.emit("newNotification", {
        message,
        image: imageUrl,
        createdAt: new Date(),
        isRead: false,
        broadcast: true 
      });

      return res.status(201).json({ message: `Đã gửi đến ${customers.length} khách hàng.` });

    } else {
      // 2. Gửi riêng cho 1 người
      if (!userId) return res.status(400).json({ message: "Vui lòng chọn khách hàng." });

      const notification = await Notification.create({
        recipient: userId,
        message,
        image: imageUrl,
      });

      // --- SOCKET: BẮN TIN RIÊNG ---
      const receiverSocketId = getReceiverSocketId(userId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", notification);
      }

      return res.status(201).json(notification);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Lỗi server khi gửi thông báo." });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 });
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
};