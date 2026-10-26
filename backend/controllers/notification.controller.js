import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

const MAX_MESSAGE = 500;

/** Upload buffer (multer memoryStorage) lên Cloudinary */
const uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "notifications" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

export const sendNotification = async (req, res) => {
  try {
    const { userId, message, sendToAll } = req.body;
    const imageFile = req.file;

    const text = typeof message === "string" ? message.slice(0, MAX_MESSAGE) : "";
    if (!text.trim() && !imageFile) {
      return res.status(400).json({ message: "Nội dung thông báo không được để trống." });
    }

    let imageUrl = "";
    if (imageFile) {
      const uploadResponse = await uploadBuffer(imageFile.buffer);
      imageUrl = uploadResponse.secure_url;
    }

    if (sendToAll === "true" || sendToAll === true) {
      const customers = await User.find({ role: "customer" }).select("_id").lean();

      const notifications = customers.map((customer) => ({
        recipient: customer._id,
        message: text,
        image: imageUrl,
      }));

      if (notifications.length > 0) await Notification.insertMany(notifications);

      // Broadcast chứa nội dung thông báo chung, không phải dữ liệu cá nhân
      io.emit("newNotification", {
        message: text,
        image: imageUrl,
        createdAt: new Date(),
        isRead: false,
        broadcast: true,
      });

      return res.status(201).json({ message: `Đã gửi đến ${customers.length} khách hàng.` });
    }

    if (!userId) return res.status(400).json({ message: "Vui lòng chọn khách hàng." });

    const receiver = await User.findById(userId).select("_id");
    if (!receiver) return res.status(404).json({ message: "Không tìm thấy khách hàng." });

    const notification = await Notification.create({
      recipient: userId,
      message: text,
      image: imageUrl,
    });

    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newNotification", notification);
    }

    return res.status(201).json(notification);
  } catch (error) {
    console.error("[SEND NOTIFICATION]", error.message);
    res.status(500).json({ message: "Lỗi server khi gửi thông báo." });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    console.error("[GET NOTIFICATIONS]", error.message);
    res.status(500).json({ message: "Lỗi lấy danh sách thông báo." });
  }
};

export const markAsRead = async (req, res) => {
  try {
    // Chỉ được đánh dấu thông báo của chính mình
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }

    res.json(notification);
  } catch (error) {
    console.error("[MARK READ]", error.message);
    res.status(500).json({ message: "Lỗi cập nhật trạng thái." });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    // Chỉ được xoá thông báo của chính mình
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }

    if (notification.image) {
      try {
        const publicId = notification.image.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch {
        /* ảnh đã bị xoá thì bỏ qua */
      }
    }

    await notification.deleteOne();

    res.json({ message: "Đã xóa thông báo và ảnh đính kèm" });
  } catch (error) {
    console.error("[DELETE NOTIFICATION]", error.message);
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
        } catch {
          /* ignore */
        }
      }
    }

    await Notification.deleteMany({ recipient: req.user._id });

    res.json({ message: "Đã xóa tất cả thông báo" });
  } catch (error) {
    console.error("[DELETE ALL NOTIFICATIONS]", error.message);
    res.status(500).json({ message: "Lỗi server khi xóa tất cả thông báo" });
  }
};
