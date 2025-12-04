import express from "express";
import { login, logout, signup, refreshToken, getProfile, updateProfile, facebookLogin, getAllUsers } from "../controllers/auth.cotroller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);
router.post("/refresh-token",refreshToken);
router.get("/profile",protectRoute,getProfile);
router.put("/profile", protectRoute, updateProfile);
router.post("/facebook/login", facebookLogin);

router.get("/users", protectRoute, adminRoute, getAllUsers);

export default router