import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    coverMedia: {
      url: { type: String, default: "" },
      type: { type: String, enum: ["image", "video"], default: "image" },
    },
    gradientFrom: { type: String, default: "#3b82f6" }, 
    gradientTo: { type: String, default: "#06b6d4" },
    
    isSpecial: { type: Boolean, default: false },
    specialPosition: { 
      type: String, 
      enum: ["below_banner", "below_categories", "below_featured"], 
      default: "below_banner" 
    },

    isFullSize: { type: Boolean, default: false }, 
    generalScale: { type: Number, default: 100 },  

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
        category: String,
        isSale: { type: Boolean, default: false },
        salePercentage: { type: Number, default: 0 },
        isPreOrder: { type: String, default: "None" },
        productLink: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Collection", collectionSchema);