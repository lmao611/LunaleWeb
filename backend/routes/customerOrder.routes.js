import express from "express";
import { 
  createOrder, 
  getAllOrders, 
  updateOrderStatus, 
  deleteOrder,
  getMyOrders,       // Import mới
  cancelMyOrder,     // Import mới
  updateOrderAddress // Import mới
} from "../controllers/customerOrder.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// --- ROUTES CHO KHÁCH HÀNG ---
router.post("/", protectRoute, createOrder); // Tạo đơn
router.get("/my-orders", protectRoute, getMyOrders); // Xem lịch sử đơn của mình
router.put("/:id/cancel", protectRoute, cancelMyOrder); // Hủy đơn
router.put("/:id/address", protectRoute, updateOrderAddress); // Sửa địa chỉ

// --- ROUTES CHO ADMIN ---
router.get("/", protectRoute, adminRoute, getAllOrders);
router.patch("/:id", protectRoute, adminRoute, updateOrderStatus);
router.delete("/:id", protectRoute, adminRoute, deleteOrder);

export default router;