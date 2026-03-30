import express from "express";
import { 
  getProduction, saveProduction, getAllProductions, verifyPassword, 
  protectProductionRoute, checkAuth, clearAuth 
} from "../controllers/production.controller.js";

const router = express.Router();

// Các route truy cập tự do
router.post("/verify-password", verifyPassword);
router.post("/clear-auth", clearAuth); // Route xóa phiên đăng nhập

// CÁC ROUTE ĐÃ BỊ KHÓA CHẶT 🔒
router.get("/check-auth", protectProductionRoute, checkAuth);
router.get("/", protectProductionRoute, getAllProductions);
router.get("/:productId", protectProductionRoute, getProduction);
router.post("/:productId", protectProductionRoute, saveProduction);

export default router;