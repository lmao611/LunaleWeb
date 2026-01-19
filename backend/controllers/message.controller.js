import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js"; // Import Notification
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: currentUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: chatPartnerId } = req.params;
    const myId = req.user._id;

    // Logic lấy tin nhắn (giữ nguyên logic đã sửa ở các bước trước cho Customer/Admin)
    if (req.user.role === "customer") {
        const messages = await Message.find({
            $or: [{ senderId: myId }, { receiverId: myId }]
        }).sort({ createdAt: 1 });
        return res.status(200).json(messages);
    }

    const messages = await Message.find({
      $or: [{ senderId: chatPartnerId }, { receiverId: chatPartnerId }],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // 1. Bắn Socket tin nhắn (Logic Chat cũ)
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // 2. Logic đồng bộ tin nhắn cho Admin (Logic cũ)
    const admins = await User.find({ role: { $in: ["admin", "controller"] } });
    admins.forEach(admin => {
        if (admin._id.toString() !== senderId.toString() && admin._id.toString() !== receiverId.toString()) {
            const adminSocketId = getReceiverSocketId(admin._id);
            if (adminSocketId) io.to(adminSocketId).emit("newMessage", newMessage);
        }
    });

    // ============================================================
    // 3. TẠO THÔNG BÁO (NOTIFICATION) VÀO DATABASE & SOCKET CHUÔNG
    // ============================================================
    try {
        const sender = await User.findById(senderId).select("name");
        const notifMsg = `Tin nhắn mới từ ${sender.name}: ${text ? text.substring(0, 30) + (text.length > 30 ? "..." : "") : "Đã gửi một ảnh"}`;

        // Tạo Notification trong DB
        const newNotif = await Notification.create({
            recipient: receiverId,
            message: notifMsg,
            type: "message",
            relatedId: senderId, // Lưu ID người gửi để lúc click vào biết mở chat với ai
            isRead: false
        });

        // Bắn Socket thông báo (cái chuông)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newNotification", newNotif);
        }
        
        // Nếu người nhận là Admin, có thể bắn cho các Admin khác (tùy nhu cầu, ở đây tôi chỉ bắn cho người nhận chính)

    } catch (notifError) {
        console.error("Lỗi tạo thông báo:", notifError);
    }
    // ============================================================

    res.status(201).json(newMessage);

    // Auto Reply Logic (Giữ nguyên)
    if (req.user.role === "customer") {
        const messageCount = await Message.countDocuments({
            $or: [{ senderId: senderId }, { receiverId: senderId }]
        });

        if (messageCount === 1) {
            const autoText = "Chào Chị, Cảm Ơn Chị đã quan tâm đến Lunale ạ 🌸\n\n✨ Chị để lại câu hỏi về sản phẩm đang quan tâm Lunale sẽ hỗ trợ tư vấn sớm cho Chị nhé ạ.\n\nHello, Thank you for your interest in Lunale 🌸\n\n✨ Please leave your questions about the products you are interested in, Lunale will support you soon.";
            setTimeout(async () => {
                try {
                    const autoMessage = new Message({ senderId: receiverId, receiverId: senderId, text: autoText });
                    await autoMessage.save();
                    const customerSocket = getReceiverSocketId(senderId);
                    if (customerSocket) io.to(customerSocket).emit("newMessage", autoMessage);
                } catch (err) { console.error(err); }
            }, 1500);
        }
    }

  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
};