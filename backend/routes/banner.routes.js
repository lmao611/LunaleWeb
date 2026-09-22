import express from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";
import Banner from "../models/banner.model.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", protectRoute, adminRoute, upload.single("banner"), async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "banners" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    const banner = await Banner.findOneAndUpdate(
      {},
      { imageUrl: result.secure_url },
      { upsert: true, new: true }
    );

    res.status(200).json(banner);
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const banner = await Banner.findOne({});
    if (!banner) return res.status(404).json({ message: "No banner found" });
    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

export default router;