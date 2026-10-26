import express from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";
import Banner from "../models/banner.model.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ chấp nhận file ảnh"));
    }
    cb(null, true);
  },
});

const uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "banners" }, (error, result) =>
        error ? reject(error) : resolve(result)
      )
      .end(buffer);
  });

/**
 * Nhận 1 trong 2 dạng:
 *  - multipart/form-data với field "banner" (admin upload trực tiếp)
 *  - JSON { imageUrl } (URL đã upload sẵn từ Cloudinary)
 */
router.post("/", protectRoute, adminRoute, upload.single("banner"), async (req, res) => {
  try {
    let imageUrl = "";

    if (req.file) {
      const result = await uploadBuffer(req.file.buffer);
      imageUrl = result.secure_url;
    } else if (typeof req.body?.imageUrl === "string" && req.body.imageUrl.startsWith("http")) {
      imageUrl = req.body.imageUrl;
    } else {
      return res.status(400).json({ message: "Thiếu file banner hoặc imageUrl" });
    }

    const banner = await Banner.findOneAndUpdate(
      {},
      { imageUrl },
      { upsert: true, new: true }
    );

    res.status(200).json(banner);
  } catch (err) {
    console.error("[BANNER UPLOAD]", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
});

router.get("/", async (req, res) => {
  try {
    const banner = await Banner.findOne({});
    if (!banner) return res.status(404).json({ message: "No banner found" });
    res.json(banner);
  } catch (err) {
    console.error("[BANNER GET]", err.message);
    res.status(500).json({ message: "Fetch failed" });
  }
});

export default router;
