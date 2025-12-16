import express from "express";
import { createOrder, getAllOrders, updateOrderStatus, deleteOrder } from "../controllers/customerOrder.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, createOrder); // Khách đặt hàng
router.get("/", protectRoute, adminRoute, getAllOrders); // Admin xem
router.patch("/:id", protectRoute, adminRoute, updateOrderStatus); // Admin sửa trạng thái
router.delete("/:id", protectRoute, adminRoute, deleteOrder); // Admin xóa

export default router;