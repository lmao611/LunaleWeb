import express from "express";
import { 
  getProduction, saveProduction, getAllProductions, verifyPassword, 
  protectProductionRoute, checkAuth 
} from "../controllers/production.controller.js";

const router = express.Router();

// Route cho phép truy cập tự do
router.post("/verify-password", verifyPassword);

// API kiểm tra session cho Frontend
router.get("/check-auth", protectProductionRoute, checkAuth);

// CÁC ROUTE ĐÃ BỊ KHÓA CHẶT 🔒
router.get("/", protectProductionRoute, getAllProductions);
router.get("/:productId", protectProductionRoute, getProduction);
router.post("/:productId", protectProductionRoute, saveProduction);

export default router;