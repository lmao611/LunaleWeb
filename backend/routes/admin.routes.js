import express from "express";
import cloudinary from "../lib/cloudinary.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Chỉ cho phép các thư mục cố định, tránh ghi bừa lên Cloudinary
const ALLOWED_FOLDERS = {
  products: "products",
  thumbnails: "products/thumbnails",
  banners: "banners",
};

/**
 * Trả chữ ký để trình duyệt upload TRỰC TIẾP lên Cloudinary.
 * Nhờ vậy ảnh không phải đi qua server dưới dạng base64
 * (không vướng giới hạn body và giữ nguyên chất lượng gốc).
 */
router.get("/upload-signature", protectRoute, adminRoute, (req, res) => {
  try {
    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY) {
      return res.status(503).json({ message: "Cloudinary chưa được cấu hình" });
    }

    const folder = ALLOWED_FOLDERS[req.query.folder] || ALLOWED_FOLDERS.products;
    const resourceType = req.query.type === "video" ? "video" : "image";
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
      resourceType,
    });
  } catch (err) {
    console.error("[UPLOAD SIGNATURE]", err.message);
    res.status(500).json({ message: "Không tạo được chữ ký upload" });
  }
});

router.post("/delete-cloudinary", protectRoute, adminRoute, async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId || typeof publicId !== "string") {
      return res.status(400).json({ message: "Thiếu publicId" });
    }

    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    res.json({ success: true, result });
  } catch (err) {
    console.error("[CLOUDINARY DELETE]", err.message);
    res.status(500).json({ message: "Xóa ảnh thất bại" });
  }
});

export default router;
