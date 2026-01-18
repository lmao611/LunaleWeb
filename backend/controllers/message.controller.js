import User from "../models/user.model.js";
import Message from "../models/message.model.js";
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

// --- SỬA LOGIC LẤY TIN NHẮN (ĐỒNG BỘ LỊCH SỬ) ---
export const getMessages = async (req, res) => {
  try {
    const { id: chatPartnerId } = req.params;
    const myId = req.user._id;

    // 1. Nếu người gọi là KHÁCH HÀNG: Lấy toàn bộ tin nhắn của họ (gửi hoặc nhận)
    // Không quan trọng chat với admin nào, lấy hết về.
    if (req.user.role === "customer") {
        const messages = await Message.find({
            $or: [
                { senderId: myId },
                { receiverId: myId },
            ]
        }).sort({ createdAt: 1 }); // Sắp xếp cũ -> mới
        return res.status(200).json(messages);
    }

    // 2. Nếu người gọi là ADMIN: Lấy toàn bộ tin nhắn liên quan đến Khách Hàng (chatPartnerId)
    // Bất kể ai là người gửi (Admin A, Admin B hay chính Khách đó)
    const messages = await Message.find({
      $or: [
        { senderId: chatPartnerId },
        { receiverId: chatPartnerId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- SỬA LOGIC GỬI TIN (REALTIME SYNC) ---
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

    // --- LOGIC SOCKET MỚI ---
    
    // 1. Gửi cho người nhận trực tiếp (Khách hoặc Admin đích)
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // 2. Nếu tin nhắn liên quan đến Khách hàng, hãy gửi cho TẤT CẢ ADMIN khác để đồng bộ
    // (Để Admin B cũng thấy Admin A vừa chat gì với khách)
    const admins = await User.find({ role: { $in: ["admin", "controller"] } });
    admins.forEach(admin => {
        // Không gửi lại cho chính người gửi (đã xử lý ở client) và người nhận (đã xử lý ở bước 1)
        if (admin._id.toString() !== senderId.toString() && admin._id.toString() !== receiverId.toString()) {
            const adminSocketId = getReceiverSocketId(admin._id);
            if (adminSocketId) {
                io.to(adminSocketId).emit("newMessage", newMessage);
            }
        }
    });

    res.status(201).json(newMessage);

    // --- AUTO REPLY LOGIC ---
    if (req.user.role === "customer") {
        const messageCount = await Message.countDocuments({
            $or: [
                { senderId: senderId }, // Đếm tất cả tin khách đã gửi
                { receiverId: senderId }
            ]
        });

        // Chỉ gửi tin nhắn tự động nếu đây là tin đầu tiên trong toàn bộ lịch sử của khách
        if (messageCount === 1) {
            const autoText = "Chào chị, Cảm Ơn Chị đã quan tâm đến Lunale ạ 🌸\n\n✨ Chị để lại câu hỏi về sản phẩm đang quan tâm Lunale sẽ hỗ trợ tư vấn sớm cho Chị nhé ạ.\n\nHello, Thank you for your interest in Lunale 🌸\n\n✨ Please leave your questions about the products you are interested in, Lunale will support you soon.";

            setTimeout(async () => {
                try {
                    const autoMessage = new Message({
                        senderId: receiverId, // Admin nhận sẽ đứng tên gửi
                        receiverId: senderId,
                        text: autoText,
                    });
                    await autoMessage.save();

                    // Bắn socket cho khách
                    const customerSocket = getReceiverSocketId(senderId);
                    if (customerSocket) io.to(customerSocket).emit("newMessage", autoMessage);

                    // Bắn socket cho toàn bộ admin
                    const allAdmins = await User.find({ role: { $in: ["admin", "controller"] } });
                    allAdmins.forEach(admin => {
                         const adminSocket = getReceiverSocketId(admin._id);
                         if(adminSocket) io.to(adminSocket).emit("newMessage", autoMessage);
                    });

                } catch (err) {
                    console.error(err);
                }
            }, 1500);
        }
    }

  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
    }
  }
};