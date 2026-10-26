import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io, emitToAdmins } from "../lib/socket.js";

const MAX_TEXT = 2000;
const MAX_IMAGE_BASE64 = 7 * 1024 * 1024; // ~5MB file

const isAdminRole = (role) => role === "admin" || role === "controller";

/** Chỉ trả về thông tin liên hệ của admin — không lộ email/sđt/địa chỉ */
export const getAdminContact = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ["admin", "controller"] } })
      .select("_id name avatar role")
      .lean();

    res.status(200).json(admins);
  } catch (error) {
    console.error("[ADMIN CONTACT]", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const filteredUsers = await User.find({ _id: { $ne: currentUserId } })
      .select("_id name email phoneNumber direction role avatar createdAt")
      .lean();

    const unreadSenderIds = await Notification.find({
      recipient: currentUserId,
      isRead: false,
      type: "message",
    }).distinct("relatedId");

    const unreadSet = new Set(unreadSenderIds.map((id) => id.toString()));

    const usersWithStatus = filteredUsers.map((user) => ({
      ...user,
      hasUnread: unreadSet.has(user._id.toString()),
    }));

    res.status(200).json(usersWithStatus);
  } catch (error) {
    console.error("[CHAT USERS]", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json([]);
    }

    const { id: chatPartnerId } = req.params;
    const myId = req.user._id;

    // Khách chỉ đọc được hội thoại của chính mình
    if (!isAdminRole(req.user.role)) {
      const messages = await Message.find({
        $or: [{ senderId: myId }, { receiverId: myId }],
      })
        .sort({ createdAt: 1 })
        .lean();
      return res.status(200).json(messages);
    }

    const messages = await Message.find({
      $or: [{ senderId: chatPartnerId }, { receiverId: chatPartnerId }],
    })
      .sort({ createdAt: 1 })
      .lean();

    await Notification.updateMany(
      { recipient: myId, type: "message", relatedId: chatPartnerId, isRead: false },
      { isRead: true }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error("[GET MESSAGES]", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const safeText = typeof text === "string" ? text.slice(0, MAX_TEXT) : "";
    if (!safeText.trim() && !image) {
      return res.status(400).json({ error: "Tin nhắn rỗng" });
    }

    if (!receiverId) return res.status(400).json({ error: "Thiếu người nhận" });

    const receiver = await User.findById(receiverId).select("_id role name");
    if (!receiver) return res.status(404).json({ error: "Người nhận không tồn tại" });

    // Khách chỉ được nhắn cho admin/controller (chống spam người dùng khác)
    if (!isAdminRole(req.user.role) && !isAdminRole(receiver.role)) {
      return res.status(403).json({ error: "Không thể gửi tin nhắn cho người dùng này" });
    }

    let imageUrl;
    if (image) {
      if (typeof image !== "string" || image.length > MAX_IMAGE_BASE64) {
        return res.status(400).json({ error: "Ảnh quá lớn" });
      }
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "lunale_chat",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: safeText,
      image: imageUrl,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // Admin đang online khác cũng thấy tin mới
    const admins = await User.find({ role: { $in: ["admin", "controller"] } })
      .select("_id")
      .lean();
    admins.forEach((admin) => {
      if (
        admin._id.toString() !== senderId.toString() &&
        admin._id.toString() !== receiverId.toString()
      ) {
        const adminSocketId = getReceiverSocketId(admin._id);
        if (adminSocketId) io.to(adminSocketId).emit("newMessage", newMessage);
      }
    });

    try {
      const sender = await User.findById(senderId).select("name");
      const notifMsg = `Tin nhắn mới từ ${sender?.name || "Khách"}: ${
        safeText
          ? safeText.substring(0, 30) + (safeText.length > 30 ? "..." : "")
          : "Đã gửi một ảnh"
      }`;

      const newNotif = await Notification.create({
        recipient: receiverId,
        message: notifMsg,
        type: "message",
        relatedId: senderId,
        isRead: false,
      });

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", newNotif);
      }
    } catch {
      /* thông báo lỗi không nên chặn việc gửi tin */
    }

    res.status(201).json(newMessage);

    // Trả lời tự động cho khách ở tin nhắn đầu tiên
    if (!isAdminRole(req.user.role)) {
      const messageCount = await Message.countDocuments({
        $or: [{ senderId: senderId }, { receiverId: senderId }],
      });

      if (messageCount <= 1) {
        const autoText =
          "Chào Chị, Cảm Ơn Chị đã quan tâm đến Lunale ạ 🌸\n\n✨ Chị để lại câu hỏi về sản phẩm đang quan tâm Lunale sẽ hỗ trợ tư vấn sớm cho Chị nhé ạ.\n\nHello, Thank you for your interest in Lunale 🌸\n\n✨ Please leave your questions about the products you are interested in, Lunale will support you soon.";

        setTimeout(async () => {
          try {
            const autoMessage = await Message.create({
              senderId: receiverId,
              receiverId: senderId,
              text: autoText,
            });
            const customerSocket = getReceiverSocketId(senderId);
            if (customerSocket) io.to(customerSocket).emit("newMessage", autoMessage);
          } catch {
            /* ignore */
          }
        }, 1500);
      }
    }
  } catch (error) {
    console.error("[SEND MESSAGE]", error.message);
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
};
