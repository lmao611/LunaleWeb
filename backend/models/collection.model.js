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
