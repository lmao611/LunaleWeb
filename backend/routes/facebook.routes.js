import express from "express";
import { facebookLogin } from "../controllers/facebook.controller.js";

const router = express.Router();

// Client sẽ gửi accessToken từ Facebook SDK lên đây
router.post("/login", facebookLogin);

export default router;
