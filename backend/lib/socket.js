import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Lưu socketId của user
const userSocketMap = {}; // {userId: socketId}

// --- THÊM BIẾN MỚI: Lưu trạng thái Admin đang xem chat ---
// Cấu trúc: { customerId: [ { adminId, adminName } ] }
const chatViewers = {}; 

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.userName; // Bạn cần truyền thêm userName từ client lên (sẽ làm ở bước 2)
  
  if (userId) userSocketMap[userId] = socket.id;

  // Gửi danh sách online user
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  
  // Gửi danh sách người đang xem chat hiện tại cho người mới vào
  socket.emit("viewersUpdated", chatViewers);

  // ==========================================
  // 🟢 LOGIC MỚI: THEO DÕI TRẠNG THÁI XEM CHAT
  // ==========================================
  
  socket.on("admin_enter_chat", ({ customerId, adminId, adminName }) => {
    if (!chatViewers[customerId]) {
        chatViewers[customerId] = [];
    }
    
    // Kiểm tra xem admin này đã có trong list chưa để tránh trùng
    const isExist = chatViewers[customerId].some(v => v.adminId === adminId);
    if (!isExist) {
        chatViewers[customerId].push({ adminId, adminName });
    }
    
    // Báo cho tất cả biết danh sách mới
    io.emit("viewersUpdated", chatViewers);
  });

  socket.on("admin_leave_chat", ({ customerId, adminId }) => {
    if (chatViewers[customerId]) {
        chatViewers[customerId] = chatViewers[customerId].filter(v => v.adminId !== adminId);
        
        // Nếu không còn ai xem thì xóa key đó luôn cho nhẹ
        if (chatViewers[customerId].length === 0) {
            delete chatViewers[customerId];
        }
    }
    io.emit("viewersUpdated", chatViewers);
  });

  // ==========================================

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // 🔴 Khi mất kết nối (F5, tắt tab), tự động xóa admin khỏi tất cả các phòng chat đang xem
    for (const customerId in chatViewers) {
        chatViewers[customerId] = chatViewers[customerId].filter(v => v.adminId !== userId);
        if (chatViewers[customerId].length === 0) {
            delete chatViewers[customerId];
        }
    }
    io.emit("viewersUpdated", chatViewers);
  });
});

export { io, app, server };