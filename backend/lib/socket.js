import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://localhost:5173",
  "http://127.0.0.1:5173",
  "https://lunale.com.vn",
  "https://www.lunale.com.vn",
  ...(process.env.ADDITIONAL_ORIGINS || "").split(","),
]
  .map((o) => (o || "").trim().replace(/\/$/, ""))
  .filter(Boolean);

const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin.replace(/\/$/, ""));

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    credentials: true,
  },
});

const userSocketMap = {};
const chatViewers = {};
const activeConnections = new Set();

/* ------------------------------------------------------------------ */
/*  Xác thực socket bằng JWT — KHÔNG tin userId do client gửi lên      */
/* ------------------------------------------------------------------ */

const readCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
};

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      readCookie(socket.handshake.headers?.cookie, "accessToken");

    if (!token || typeof token !== "string") return next(new Error("unauthorized"));

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select("_id name role avatar");

    if (!user) return next(new Error("unauthorized"));

    socket.user = user;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

export const getReceiverSocketId = (userId) => {
  return userSocketMap[String(userId)];
};

/** Gửi sự kiện chỉ cho admin/controller đang online */
export const emitToAdmins = (event, payload) => {
  io.to("admins").emit(event, payload);
};

/** Gửi sự kiện cho một user cụ thể */
export const emitToUser = (userId, event, payload) => {
  const socketId = getReceiverSocketId(userId);
  if (socketId) io.to(socketId).emit(event, payload);
};

const isAdminRole = (role) => role === "admin" || role === "controller";

io.on("connection", (socket) => {
  const user = socket.user;
  const userId = String(user._id);

  activeConnections.add(socket.id);
  io.emit("visitorCountUpdate", activeConnections.size);

  userSocketMap[userId] = socket.id;

  if (isAdminRole(user.role)) {
    socket.join("admins");
  }

  // Danh sách online chỉ dành cho admin
  io.to("admins").emit("getOnlineUsers", Object.keys(userSocketMap));
  socket.emit("viewersUpdated", chatViewers);

  socket.on("admin_enter_chat", ({ customerId, adminId, adminName }) => {
    if (!isAdminRole(user.role)) return;
    if (!customerId) return;

    if (!chatViewers[customerId]) chatViewers[customerId] = [];

    const isExist = chatViewers[customerId].some((v) => v.adminId === userId);
    if (!isExist) {
      chatViewers[customerId].push({ adminId: userId, adminName: user.name || adminName });
    }

    io.to("admins").emit("viewersUpdated", chatViewers);
  });

  socket.on("admin_leave_chat", ({ customerId }) => {
    if (!isAdminRole(user.role)) return;

    if (chatViewers[customerId]) {
      chatViewers[customerId] = chatViewers[customerId].filter((v) => v.adminId !== userId);
      if (chatViewers[customerId].length === 0) delete chatViewers[customerId];
    }
    io.to("admins").emit("viewersUpdated", chatViewers);
  });

  socket.on("disconnect", () => {
    activeConnections.delete(socket.id);
    io.emit("visitorCountUpdate", activeConnections.size);

    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
      io.to("admins").emit("getOnlineUsers", Object.keys(userSocketMap));
    }

    for (const customerId in chatViewers) {
      chatViewers[customerId] = chatViewers[customerId].filter((v) => v.adminId !== userId);
      if (chatViewers[customerId].length === 0) delete chatViewers[customerId];
    }
    io.to("admins").emit("viewersUpdated", chatViewers);
  });
});

export { io, app, server };
