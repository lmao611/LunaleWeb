import express from "express";
import {
  createOrder,
  getAllOrders,
  updateOrder,
  deleteOrder
} from "../controllers/orders.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, adminRoute, createOrder);
router.get("/", protectRoute, adminRoute, getAllOrders);
router.put("/:id", protectRoute, adminRoute, updateOrder);
router.delete("/:id", protectRoute, adminRoute, deleteOrder);

export default router;
