import Production from "../models/production.model.js";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";
import { encryptJSON, decryptJSON } from "../lib/encryption.js";

const defaultSizes = { total: 0, S: 0, M: 0, L: 0, XL: 0 };

// ==========================================
// 1. MIDDLEWARE BẢO MẬT KHU VỰC PRODUCTION
// ==========================================
export const protectProductionRoute = async (req, res, next) => {
    try {
        const token = req.cookies.prod_token; 
        if (!token) return res.status(401).json({ message: "Từ chối truy cập. Vui lòng nhập mật khẩu." });
        
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "fallback_secret");
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
// 3. CÁC API NGHIỆP VỤ (CÓ MÃ HÓA & MIGRATION)
// ==========================================
export const getAllProductions = async (req, res) => {
  try {
    const productions = await Production.find({});
    const processedProductions = [];

    for (let prod of productions) {
      const prodObj = prod.toObject();
      let needsMigration = false;

      if (!prodObj.encryptedData && (prodObj.inventory?.length > 0 || prodObj.batches?.length > 0)) {
         // Auto-migrate old plaintext data
         const encryptedData = encryptJSON({ inventory: prodObj.inventory, batches: prodObj.batches });
         await Production.findByIdAndUpdate(prod._id, { encryptedData, inventory: [], batches: [] });
         needsMigration = true;
      } else if (prodObj.encryptedData) {
         // Decrypt data for frontend
         const decrypted = decryptJSON(prodObj.encryptedData);
         if (decrypted) {
           prodObj.inventory = decrypted.inventory || [];
           prodObj.batches = decrypted.batches || [];
         }
      }

      delete prodObj.encryptedData;
      processedProductions.push(prodObj);
    }
    res.status(200).json(processedProductions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProduction = async (req, res) => {
  try {
    const { productId } = req.params;
    let production = await Production.findOne({ product: productId });
    
    if (!production) {
      const defaultData = {
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
      return res.status(200).json(defaultData);
    }

    const prodObj = production.toObject();
    
    if (!prodObj.encryptedData && (prodObj.inventory?.length > 0 || prodObj.batches?.length > 0)) {
       // Migration
       const encryptedData = encryptJSON({ inventory: prodObj.inventory, batches: prodObj.batches });
       await Production.findByIdAndUpdate(production._id, { encryptedData, inventory: [], batches: [] });
    } else if (prodObj.encryptedData) {
       // Decryption
       const decrypted = decryptJSON(prodObj.encryptedData);
       if (decrypted) {
         prodObj.inventory = decrypted.inventory || [];
         prodObj.batches = decrypted.batches || [];
       }
    }
    
    delete prodObj.encryptedData;
    res.status(200).json(prodObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveProduction = async (req, res) => {
  try {
    const { productId } = req.params;
    const { inventory, batches } = req.body;

    const encryptedData = encryptJSON({ inventory, batches });

    const production = await Production.findOneAndUpdate(
      { product: productId }, 
      { encryptedData, inventory: [], batches: [] }, 
      { new: true, upsert: true }
    );
    
    const responseData = production.toObject();
    responseData.inventory = inventory;
    responseData.batches = batches;
    delete responseData.encryptedData;

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. API XÁC THỰC MẬT KHẨU 
// ==========================================
export const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const correctPassword = process.env.PRODUCTION_PASSWORD;
    
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp && typeof clientIp === 'string') {
      clientIp = clientIp.split(',')[0].trim();
    }

    const attemptsKey = `prod_attempts:${clientIp}`;
    const lockoutsKey = `prod_lockouts:${clientIp}`;
    const lockedUntilKey = `prod_locked_until:${clientIp}`;

    const lockedUntil = await redis.get(lockedUntilKey);
    if (lockedUntil && Date.now() < parseInt(lockedUntil)) {
      const remainingTime = Math.ceil((parseInt(lockedUntil) - Date.now()) / 1000);
      return res.status(429).json({ 
        success: false, message: `IP bị khóa. Thử lại sau ${remainingTime} giây.`, isLockedOut: true
      });
    }

    if (password === correctPassword) {
      await redis.del(attemptsKey); 
      
      const token = jwt.sign(
          { role: "production_manager", ip: clientIp }, 
          process.env.ACCESS_TOKEN_SECRET || "fallback_secret", 
          { expiresIn: "2h" } 
      );
      
      res.cookie("prod_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict"
          // Không dùng maxAge nữa -> Biến thành Session Cookie (Tắt trình duyệt tự xóa)
      });

      return res.status(200).json({ success: true });
    } else {
      const attempts = await redis.incr(attemptsKey);
      if (attempts === 1) await redis.expire(attemptsKey, 60 * 60);

      if (attempts >= 6) {
        const lockouts = await redis.incr(lockoutsKey);
        await redis.del(attemptsKey);

        let penaltyTime = 0;
        if (lockouts === 1) penaltyTime = 20 * 1000;
        else if (lockouts === 2) penaltyTime = 60 * 1000;
        else penaltyTime = 60 * 60 * 1000;

        await redis.set(lockedUntilKey, Date.now() + penaltyTime, "PX", penaltyTime);

        return res.status(429).json({ 
          success: false, message: "Bạn đã bị khóa do nhập sai quá 6 lần.", isLockedOut: true
        });
      }

      return res.status(401).json({ success: false, attemptsLeft: 6 - attempts });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};