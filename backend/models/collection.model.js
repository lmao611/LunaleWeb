import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    coverMedia: {
      url: { type: String, required: true },
      type: { type: String, enum: ["image", "video"], required: true },
    },
    gradientFrom: { type: String, default: "#3b82f6" }, 
    gradientTo: { type: String, default: "#06b6d4" },
    
    isSpecial: { type: Boolean, default: false },
    specialPosition: { 
      type: String, 
      enum: ["below_banner", "below_categories", "below_featured"], 
      default: "below_banner" 
    },

    // ✅ CẬP NHẬT: Thêm chế độ Full Size & Scale chung
    isFullSize: { type: Boolean, default: false }, // Chế độ ảnh gốc
    generalScale: { type: Number, default: 100 },  // Size chung (%) cho chế độ Full Size

    // Các thông số Custom (giữ nguyên cho chế độ thường)
    desktopWidth: { type: Number, default: 100 },
    desktopHeight: { type: Number, default: 600 },
    mobileWidth: { type: Number, default: 100 },
    mobileHeight: { type: Number, default: 400 },

    hideName: { type: Boolean, default: false },
    hideDescription: { type: Boolean, default: false },

    products: [
      {
        _id: String, 
        name: String,
        image: String,
        price: Number,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Collection", collectionSchema);