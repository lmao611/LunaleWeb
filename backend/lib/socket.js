import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true, // SỬA Ở ĐÂY: Cho phép mọi origin để tránh lỗi ngầm CORS
    credentials: true, // RẤT QUAN TRỌNG: Khớp với cấu hình Frontend
  },
});

const userSocketMap = {};
const chatViewers = {};
const activeConnections = new Set();

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

io.on("connection", (socket) => {
  activeConnections.add(socket.id);
  io.emit("visitorCountUpdate", activeConnections.size);

  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.userName;
  
  // MAP ID CỦA USER VÀO SOCKET
  if (userId && userId !== "undefined") {
      userSocketMap[userId] = socket.id;
      // In ra terminal backend để bạn dễ kiểm tra:
      console.log(`🟢 [Socket] User/Admin online -> ID: ${userId} | SocketID: ${socket.id}`);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  socket.emit("viewersUpdated", chatViewers);
  
  socket.on("admin_enter_chat", ({ customerId, adminId, adminName }) => {
    if (!chatViewers[customerId]) {
        chatViewers[customerId] = [];
    }
    
    const isExist = chatViewers[customerId].some(v => v.adminId === adminId);
    if (!isExist) {
        chatViewers[customerId].push({ adminId, adminName });
    }
    
    io.emit("viewersUpdated", chatViewers);
  });

  socket.on("admin_leave_chat", ({ customerId, adminId }) => {
    if (chatViewers[customerId]) {
        chatViewers[customerId] = chatViewers[customerId].filter(v => v.adminId !== adminId);
        
        if (chatViewers[customerId].length === 0) {
            delete chatViewers[customerId];
        }
    }
    io.emit("viewersUpdated", chatViewers);
  });

  socket.on("disconnect", () => {
    activeConnections.delete(socket.id);
    io.emit("visitorCountUpdate", activeConnections.size);

    if (userId) {
        delete userSocketMap[userId];
        console.log(`🔴 [Socket] User/Admin offline -> ID: ${userId}`);
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }

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