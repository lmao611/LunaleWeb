import express from "express";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

router.post("/delete-cloudinary", async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ message: "Thiếu publicId" });

    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ Lỗi khi xóa Cloudinary:", err.message);
    res.status(500).json({ message: "Xóa ảnh thất bại", error: err.message });
  }
});

export default router;
