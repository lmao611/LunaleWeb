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
    
    // --- Special Collection Config ---
    isSpecial: { type: Boolean, default: false },
    
    specialPosition: { 
      type: String, 
      enum: ["below_banner", "below_categories", "below_featured"], 
      default: "below_banner" 
    },

    // ✅ MỚI: Render chế độ Full Size (giữ tỉ lệ gốc, max-width theo container)
    isFullSize: { type: Boolean, default: false },

    // ✅ MỚI: Size Edit - Tùy chỉnh chiều cao (pixel)
    displayHeight: { type: Number, default: 500 }, 

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