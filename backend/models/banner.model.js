import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    // Giữ field cũ để tương thích với client đang cache.
    // Với banner video, imageUrl = ảnh poster (để client cũ vẫn hiện ảnh).
    imageUrl: { type: String, required: true },

    // Media thực tế đang dùng (ảnh hoặc video)
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    posterUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
