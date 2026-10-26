import express from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  logout,
  signup,
  refreshToken,
  getProfile,
  updateProfile,
  facebookLogin,
  getAllUsers,
} from "../controllers/auth.cotroller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { ipKey } from "../lib/requestIp.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/facebook/login", authLimiter, facebookLogin);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

router.get("/profile", protectRoute, getProfile);
router.put("/profile", protectRoute, updateProfile);

router.get("/users", protectRoute, adminRoute, getAllUsers);

export default router;
