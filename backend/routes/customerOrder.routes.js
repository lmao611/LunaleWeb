import express from "express";
import { 
  createOrder, 
  getAllOrders, 
  updateOrderStatus, 
  deleteOrder,
  getMyOrders,       
  cancelMyOrder,     
  updateOrderAddress,
  createGuestOrder // Thêm hàm xử lý Guest
} from "../controllers/customerOrder.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Route cho khách vãng lai, KHÔNG dùng protectRoute
router.post("/guest", createGuestOrder); 

router.post("/", protectRoute, createOrder); 
router.get("/my-orders", protectRoute, getMyOrders); 
router.put("/:id/cancel", protectRoute, cancelMyOrder); 
router.put("/:id/address", protectRoute, updateOrderAddress); 

router.get("/", protectRoute, adminRoute, getAllOrders);
router.patch("/:id", protectRoute, adminRoute, updateOrderStatus);
router.delete("/:id", protectRoute, adminRoute, deleteOrder);

export default router;