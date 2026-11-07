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

const isCloudinaryUrl = (value) =>
  typeof value === "string" &&
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\//i.test(value);

/**
 * Cập nhật banner. Nhận 1 trong 3 dạng:
 *  1. multipart/form-data field "banner"     -> ảnh, server upload (luồng cũ)
 *  2. JSON { imageUrl }                      -> ảnh đã có sẵn trên Cloudinary
 *  3. JSON { mediaUrl, mediaType, posterUrl } -> ảnh hoặc VIDEO upload trực tiếp
 *
 * Lưu ý: KHÔNG xoá asset nào trên Cloudinary. Banner cũ vẫn nằm nguyên trên cloud.
 */
router.post("/", protectRoute, adminRoute, upload.single("banner"), async (req, res) => {
  try {
    let mediaUrl = "";
    let mediaType = "image";
    let posterUrl = "";

    if (req.file) {
      // Luồng cũ: upload ảnh qua server
      const result = await uploadBuffer(req.file.buffer);
      mediaUrl = result.secure_url;
    } else if (typeof req.body?.mediaUrl === "string" && req.body.mediaUrl) {
      // Luồng mới: trình duyệt đã upload trực tiếp lên Cloudinary
      if (!isCloudinaryUrl(req.body.mediaUrl)) {
        return res.status(400).json({ message: "URL media không hợp lệ" });
      }

      mediaUrl = req.body.mediaUrl;
      mediaType = req.body.mediaType === "video" ? "video" : "image";

      if (req.body.posterUrl) {
        if (!isCloudinaryUrl(req.body.posterUrl)) {
          return res.status(400).json({ message: "URL poster không hợp lệ" });
        }
        posterUrl = req.body.posterUrl;
      }
    } else if (typeof req.body?.imageUrl === "string" && req.body.imageUrl.startsWith("http")) {
      mediaUrl = req.body.imageUrl;
    } else {
      return res.status(400).json({ message: "Thiếu file banner hoặc mediaUrl" });
    }

    if (mediaType === "video" && !posterUrl) {
      return res.status(400).json({ message: "Banner video cần có ảnh poster" });
    }

    // Với video: imageUrl = poster để client cũ (đang cache) vẫn hiện ảnh tĩnh
    const legacyImageUrl = mediaType === "video" ? posterUrl : mediaUrl;

    const banner = await Banner.findOneAndUpdate(
      {},
      {
        imageUrl: legacyImageUrl,
        mediaUrl,
        mediaType,
        posterUrl: mediaType === "video" ? posterUrl : "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(banner);
  } catch (err) {
    console.error("[BANNER UPLOAD]", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
});

router.get("/", async (req, res) => {
  try {
    const banner = await Banner.findOne({}).lean();
    if (!banner) return res.status(404).json({ message: "No banner found" });

    // Banner cũ chưa có mediaUrl -> suy ra từ imageUrl
    const mediaUrl = banner.mediaUrl || banner.imageUrl;
    const mediaType = banner.mediaType === "video" ? "video" : "image";

    res.json({
      ...banner,
      mediaUrl,
      mediaType,
      posterUrl: banner.posterUrl || (mediaType === "video" ? banner.imageUrl : ""),
    });
  } catch (err) {
    console.error("[BANNER GET]", err.message);
    res.status(500).json({ message: "Fetch failed" });
  }
});

export default router;
