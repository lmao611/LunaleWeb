import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, min: 0, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
    // Thêm các trường cho tính năng Sale
    isSale: { type: Boolean, default: false },
    salePercentage: { type: Number, default: 0 },
    
    isPreOrder: {
      type: String,
      enum: ["None", "Pre-Order", "Hết hàng", "Số lượng còn ít"],
      default: "None",
    },
    productLink: { type: String },
    thumbnails: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;