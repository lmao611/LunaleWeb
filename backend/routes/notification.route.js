import express from "express";
import multer from "multer";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
  getUserNotifications,
  sendNotification,
  markAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Dùng memoryStorage: Render có ổ đĩa tạm, ghi file ra disk sẽ đầy dần
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ chấp nhận file ảnh"));
    }
    cb(null, true);
  },
});

// User routes
router.get("/", protectRoute, getUserNotifications);
router.put("/:id/read", protectRoute, markAsRead);
router.delete("/all", protectRoute, deleteAllNotifications);
router.delete("/:id", protectRoute, deleteNotification);

// Admin routes
router.post("/send", protectRoute, adminRoute, upload.single("image"), sendNotification);

export default router;
