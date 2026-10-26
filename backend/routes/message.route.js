import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  getAdminContact,
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/message.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

const GUEST_COOKIE = "guestToken";
const GUEST_COOKIE_MS = 7 * 24 * 60 * 60 * 1000;

const guestCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

/**
 * Xác thực cho khu vực chat:
 *  1. User đã đăng nhập (accessToken)          -> dùng luôn
 *  2. Khách đã có cookie guestToken            -> dùng tài khoản khách đó
 *  3. Khách gửi kèm guestInfo (lần đầu)        -> tạo/khôi phục theo guestId
 */
const handleGuestAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = bearer || req.cookies?.accessToken;

    if (token) {
      return protectRoute(req, res, next);
    }

    const guestToken = req.cookies?.[GUEST_COOKIE];
    if (guestToken) {
      try {
        const decoded = jwt.verify(guestToken, process.env.ACCESS_TOKEN_SECRET);
        const guest = await User.findById(decoded.userId).select("-password");
        if (guest) {
          req.user = guest;
          return next();
        }
      } catch {
        /* token khách hỏng -> đi tiếp xuống dưới */
      }
    }

    if (req.method === "POST" && req.body?.guestInfo) {
      const { phone, name, address, guestId } = req.body.guestInfo;

      if (!guestId || typeof guestId !== "string" || guestId.length < 8) {
        return res.status(400).json({ error: "Thiếu mã khách (guestId)" });
      }
      if (!phone || typeof phone !== "string" || phone.replace(/\D/g, "").length < 8) {
        return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
      }

      // Danh tính khách dựa trên guestId ngẫu nhiên do trình duyệt sinh,
      // KHÔNG dựa trên số điện thoại -> không thể nhập SĐT người khác để đọc chat.
      const email = `guest_${crypto
        .createHash("sha256")
        .update(guestId)
        .digest("hex")
        .slice(0, 24)}@guest.lunale.com`;

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: `${String(name || "Khách").slice(0, 50)} (Khách)`,
          email,
          password: crypto.randomBytes(24).toString("hex"),
          phoneNumber: String(phone).slice(0, 20),
          direction: String(address || "").slice(0, 300),
          role: "customer",
        });
      } else {
        if (address) user.direction = String(address).slice(0, 300);
        if (phone) user.phoneNumber = String(phone).slice(0, 20);
        await user.save();
      }

      const newToken = jwt.sign({ userId: user._id, guest: true }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });

      res.cookie(GUEST_COOKIE, newToken, {
        ...guestCookieOptions(),
        maxAge: GUEST_COOKIE_MS,
      });

      req.user = user;
      return next();
    }

    if (req.method === "GET") {
      req.user = null;
      return next();
    }

    return res.status(401).json({ error: "Unauthorized" });
  } catch (error) {
    console.error("[CHAT AUTH]", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Admin lấy toàn bộ danh sách khách
router.get("/users", protectRoute, adminRoute, getUsersForSidebar);

// Khách/user lấy thông tin liên hệ admin (chỉ tên + avatar, không lộ dữ liệu khác)
router.get("/admin-contact", getAdminContact);

router.get("/:id", handleGuestAuth, getMessages);
router.post("/send/:id", handleGuestAuth, sendMessage);

export default router;
