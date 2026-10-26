import express from "express";
import rateLimit from "express-rate-limit";
import { trackVisit, getDailyVisits } from "../controllers/analytics.controller.js";
import { protectRoute, adminRoute, optionalAuth } from "../middleware/auth.middleware.js";
import { ipKey } from "../lib/requestIp.js";

const router = express.Router();

const trackLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { message: "Quá nhiều yêu cầu" },
});

// optionalAuth: nếu có token hợp lệ thì biết là ai, không thì coi như khách
router.post("/track", trackLimiter, optionalAuth, trackVisit);
router.get("/daily", protectRoute, adminRoute, getDailyVisits);

export default router;
