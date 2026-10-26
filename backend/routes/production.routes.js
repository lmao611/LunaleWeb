import express from "express";
import rateLimit from "express-rate-limit";
import {
  getProduction,
  saveProduction,
  getAllProductions,
  verifyPassword,
  protectProductionRoute,
  checkAuth,
  clearAuth,
} from "../controllers/production.controller.js";
import { ipKey } from "../lib/requestIp.js";

const router = express.Router();

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { success: false, message: "Quá nhiều lần thử. Vui lòng đợi 15 phút." },
});

// Route công khai (vẫn bị rate-limit)
router.post("/verify-password", verifyLimiter, verifyPassword);
router.post("/clear-auth", clearAuth);

// Các route đã khoá
router.get("/check-auth", protectProductionRoute, checkAuth);
router.get("/", protectProductionRoute, getAllProductions);
router.get("/:productId", protectProductionRoute, getProduction);
router.post("/:productId", protectProductionRoute, saveProduction);

export default router;
