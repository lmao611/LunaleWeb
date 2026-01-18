import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getUserNotifications, sendNotification, markAsRead, deleteNotification } from "../controllers/notification.controller.js";
// Import cấu hình multer của bạn (thường nằm ở lib hoặc middleware)
// Nếu chưa có file riêng, bạn có thể dùng code mẫu dưới đây để test nhanh:
import multer from "multer";
const upload = multer({ dest: "uploads/" }); 

const router = express.Router();

// User routes
router.get("/", protectRoute, getUserNotifications);
router.put("/:id/read", protectRoute, markAsRead);
router.delete("/:id", protectRoute, deleteNotification);

// Admin routes
router.post("/send", protectRoute, adminRoute, upload.single("image"), sendNotification);

export default router;