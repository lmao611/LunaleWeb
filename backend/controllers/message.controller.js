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

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

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

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);

    if (req.user.role === "customer") {
        const messageCount = await Message.countDocuments({
            $or: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        });

        if (messageCount === 1) {
            const autoText = "Chào Chị, Cảm Ơn Chị đã quan tâm đến Lunale ạ 🌸\n\n✨ Chị để lại câu hỏi về sản phẩm đang quan tâm Lunale sẽ hỗ trợ tư vấn sớm cho Chị nhé ạ.\n\nHello, Thank you for your interest in Lunale 🌸\n\n✨ Please leave your questions about the products you are interested in, Lunale will support you soon.";

            setTimeout(async () => {
                try {
                    const autoMessage = new Message({
                        senderId: receiverId,
                        receiverId: senderId,
                        text: autoText,
                    });

                    await autoMessage.save();

                    const customerSocket = getReceiverSocketId(senderId);
                    if (customerSocket) {
                        io.to(customerSocket).emit("newMessage", autoMessage);
                    }

                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit("newMessage", autoMessage);
                    }

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