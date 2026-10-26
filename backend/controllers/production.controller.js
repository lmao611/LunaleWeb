import Production from "../models/production.model.js";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getClientIp } from "../lib/requestIp.js";

const safeRedis = async (fn, fallback = null) => {
    try {
        return await fn();
    } catch (err) {
        console.error("[REDIS]", err.message);
        return fallback;
    }
};

const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest();

/** So sánh timing-safe để không rò rỉ độ dài/ký tự mật khẩu */
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));

const defaultSizes = { total: 0, S: 0, M: 0, L: 0, XL: 0 };

// ==========================================
// 1. MIDDLEWARE BẢO MẬT KHU VỰC PRODUCTION
// ==========================================
export const protectProductionRoute = async (req, res, next) => {
    try {
        const token = req.cookies.prod_token; 
        if (!token) return res.status(401).json({ message: "Từ chối truy cập. Vui lòng nhập mật khẩu." });
        
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (decoded.role !== "production_manager") {
            return res.status(403).json({ message: "Không có quyền truy cập" });
        }
        next(); 
    } catch (error) {
        return res.status(401).json({ message: "Phiên đăng nhập hết hạn, vui lòng nhập lại mật khẩu" });
    }
};

// ==========================================
// 2. API KIỂM TRA & XÓA PHIÊN (Cho Frontend)
// ==========================================
export const checkAuth = async (req, res) => {
    res.status(200).json({ success: true });
};

// API TỰ ĐỘNG XÓA COOKIE KHI THOÁT TRANG
export const clearAuth = async (req, res) => {
    res.clearCookie("prod_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
    });
    res.status(200).json({ success: true });
};

// ==========================================
// 3. CÁC API NGHIỆP VỤ 
// ==========================================
export const getAllProductions = async (req, res) => {
  try {
    const productions = await Production.find({});
    res.status(200).json(productions);
  } catch (error) {
    res.status(500).json({ message: "L?i server" });
  }
};

export const getProduction = async (req, res) => {
  try {
    const { productId } = req.params;
    let production = await Production.findOne({ product: productId });
    
    if (!production) {
      production = {
        product: productId,
        inventory: [{
          tonDauKy: { ...defaultSizes }, ngayNhap: "", nhapTrongKy: { ...defaultSizes },
          ngayXuat: "", xuatTrongKy: { ...defaultSizes }, tonCuoiKy: { ...defaultSizes }
        }],
        batches: [{
          items: [
            { name: "Vải Chính", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Vải Lót", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Gọng", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Ép Keo", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Cắt", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Gia công", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 }
          ]
        }]
      };
    }
    res.status(200).json(production);
  } catch (error) {
    res.status(500).json({ message: "L?i server" });
  }
};

export const saveProduction = async (req, res) => {
  try {
    const { productId } = req.params;
    const { inventory, batches } = req.body;

    const production = await Production.findOneAndUpdate(
      { product: productId }, { inventory, batches }, { new: true, upsert: true }
    );
    res.status(200).json(production);
  } catch (error) {
    res.status(500).json({ message: "L?i server" });
  }
};

// ==========================================
// 4. API XÁC THỰC MẬT KHẨU 
// ==========================================
export const verifyPassword = async (req, res) => {
  try {
    const correctPassword = process.env.PRODUCTION_PASSWORD;

    // Không được để mật khẩu rỗng: nếu biến môi trường chưa set thì
    // `password === undefined` sẽ cho qua -> chặn hẳn.
    if (!correctPassword || correctPassword.length < 6) {
      console.error("[PRODUCTION] PRODUCTION_PASSWORD chưa được cấu hình");
      return res.status(503).json({
        success: false,
        message: "Khu vực sản xuất chưa được cấu hình. Liên hệ quản trị viên.",
      });
    }

    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const clientIp = getClientIp(req);

    const attemptsKey = `prod_attempts:${clientIp}`;
    const lockoutsKey = `prod_lockouts:${clientIp}`;
    const lockedUntilKey = `prod_locked_until:${clientIp}`;

    const lockedUntil = await safeRedis(() => redis.get(lockedUntilKey));
    if (lockedUntil && Date.now() < parseInt(lockedUntil)) {
      const remainingTime = Math.ceil((parseInt(lockedUntil) - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `IP bị khóa. Thử lại sau ${remainingTime} giây.`,
        isLockedOut: true,
      });
    }

    if (password && safeEqual(password, correctPassword)) {
      await safeRedis(() => redis.del(attemptsKey));

      const token = jwt.sign(
        { role: "production_manager", ip: clientIp },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "2h" }
      );

      res.cookie("prod_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });

      return res.status(200).json({ success: true });
    }

    const attempts = await safeRedis(() => redis.incr(attemptsKey), 0);
    if (attempts === 1) await safeRedis(() => redis.expire(attemptsKey, 60 * 60));

    if (typeof attempts === "number" && attempts >= 6) {
      const lockouts = await safeRedis(() => redis.incr(lockoutsKey), 1);
      await safeRedis(() => redis.del(attemptsKey));

      let penaltyTime = 60 * 60 * 1000;
      if (lockouts === 1) penaltyTime = 20 * 1000;
      else if (lockouts === 2) penaltyTime = 60 * 1000;

      await safeRedis(() => redis.set(lockedUntilKey, Date.now() + penaltyTime, "PX", penaltyTime));

      return res.status(429).json({
        success: false,
        message: "Bạn đã bị khóa do nhập sai quá 6 lần.",
        isLockedOut: true,
      });
    }

    return res.status(401).json({
      success: false,
      attemptsLeft: Math.max(0, 6 - (typeof attempts === "number" ? attempts : 0)),
    });
  } catch (error) {
    console.error("[PRODUCTION VERIFY]", error.message);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};