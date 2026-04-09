import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

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
      const customers = await User.find({ role: "customer" });
      
      const notifications = customers.map((customer) => ({
        recipient: customer._id,
        message,
        image: imageUrl,
      }));

      await Notification.insertMany(notifications);
      
      io.emit("newNotification", {
        message,
        image: imageUrl,
        createdAt: new Date(),
        isRead: false,
        broadcast: true 
      });

      return res.status(201).json({ message: `Đã gửi đến ${customers.length} khách hàng.` });

    } else {
      if (!userId) return res.status(400).json({ message: "Vui lòng chọn khách hàng." });

      const notification = await Notification.create({
        recipient: userId,
        message,
        image: imageUrl,
      });

      const receiverSocketId = getReceiverSocketId(userId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", notification);
      }

      return res.status(201).json(notification);
    }
  } catch (error) {
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
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }
    if (notification.image) {
      try {
        const publicId = notification.image.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
      }
    }
    await Notification.findByIdAndDelete(id);
    
    res.json({ message: "Đã xóa thông báo và ảnh đính kèm" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xóa thông báo" });
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id });
    
    for (const notif of notifications) {
      if (notif.image) {
        try {
          const publicId = notif.image.split("/").slice(-2).join("/").split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
        }
      }
    }
    
    await Notification.deleteMany({ recipient: req.user._id });
    
    res.json({ message: "Đã xóa tất cả thông báo" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xóa tất cả thông báo" });
  }
};