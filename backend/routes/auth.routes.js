import express from "express";
import rateLimit from "express-rate-limit";
import { login, logout, signup, refreshToken, getProfile, updateProfile, facebookLogin, getAllUsers } from "../controllers/auth.cotroller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/signup requests per `window` (here, per 15 minutes)
  message: { message: "Too many attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout",logout);
router.post("/refresh-token",refreshToken);
router.get("/profile",protectRoute,getProfile);
router.put("/profile", protectRoute, updateProfile);
router.post("/facebook/login", facebookLogin);

router.get("/users", protectRoute, adminRoute, getAllUsers);

export default router