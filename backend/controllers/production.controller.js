import Production from "../models/production.model.js";

const defaultSizes = { total: 0, S: 0, M: 0, L: 0, XL: 0 };
export const ipTracker = {};

export const getAllProductions = async (req, res) => {
  try {
    const productions = await Production.find({});
    res.status(200).json(productions);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
          tonDauKy: { ...defaultSizes },
          ngayNhap: "",
          nhapTrongKy: { ...defaultSizes },
          ngayXuat: "",
          xuatTrongKy: { ...defaultSizes },
          tonCuoiKy: { ...defaultSizes }
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
    res.status(500).json({ message: error.message });
  }
};

export const saveProduction = async (req, res) => {
  try {
    const { productId } = req.params;
    const { inventory, batches } = req.body;

    const production = await Production.findOneAndUpdate(
      { product: productId },
      { inventory, batches },
      { new: true, upsert: true }
    );

    res.status(200).json(production);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const correctPassword = process.env.PRODUCTION_PASSWORD;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!ipTracker[clientIp]) {
      ipTracker[clientIp] = { attempts: 0, lockouts: 0, lockedUntil: null };
    }

    const tracker = ipTracker[clientIp];

    if (tracker.lockedUntil && new Date() < tracker.lockedUntil) {
      const remainingTime = Math.ceil((tracker.lockedUntil - new Date()) / 1000);
      return res.status(429).json({ 
        success: false, 
        message: `IP bị khóa. Thử lại sau ${remainingTime} giây.`,
        isLockedOut: true
      });
    }

    if (password === correctPassword) {
      tracker.attempts = 0;
      return res.status(200).json({ success: true });
    } else {
      tracker.attempts += 1;

      if (tracker.attempts >= 6) {
        tracker.lockouts += 1;
        tracker.attempts = 0;

        let penaltyTime = 0;
        if (tracker.lockouts === 1) penaltyTime = 20 * 1000;
        else if (tracker.lockouts === 2) penaltyTime = 60 * 1000;
        else penaltyTime = 60 * 60 * 1000;

        tracker.lockedUntil = new Date(Date.now() + penaltyTime);

        return res.status(429).json({ 
          success: false, 
          message: "Bạn đã bị khóa và đăng xuất do nhập sai quá 6 lần.",
          isLockedOut: true
        });
      }

      return res.status(401).json({ 
        success: false, 
        attemptsLeft: 6 - tracker.attempts 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};