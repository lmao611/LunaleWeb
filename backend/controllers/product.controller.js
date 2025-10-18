import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import { redis } from "../lib/redis.js";
import mongoose from "mongoose";

// -------------------- Helper --------------------
const getPublicId = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[^/.]+$/);
  return match ? match[1] : null;
};

// -------------------- Redis cache helpers --------------------
async function clearFeaturedCache() {
  try {
    await redis.del("featured_products");
    console.log("🧹 Cleared Redis cache: featured_products");
  } catch (err) {
    console.error("❌ Failed to clear featured cache:", err);
  }
}

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    console.log("✅ Updated featured_products cache");
  } catch (error) {
    console.log("❌ Error updating featured cache:", error.message);
  }
}

// -------------------- Get all products --------------------
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (error) {
    console.log("Error in getAllProducts ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get product by ID --------------------
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------- Get featured products --------------------
export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      console.log("✅ Served from Redis cache");
      return res.json(JSON.parse(featuredProducts));
    }

    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts.length)
      return res.status(404).json({ message: "No featured products found" });

    await redis.set("featured_products", JSON.stringify(featuredProducts));
    console.log("⚙️ Cached featured_products to Redis");

    res.json(featuredProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducts ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Create product --------------------
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, thumbnails, productLink, isPreOrder } = req.body;

    let mainImageUrl = "";
    let thumbnailUrls = [];

    // Upload ảnh chính
    if (image) {
      const uploadedMain = await cloudinary.uploader.upload(image, { folder: "products" });
      mainImageUrl = uploadedMain.secure_url;
    }

    // Upload thumbnails
    if (thumbnails && Array.isArray(thumbnails)) {
      const uploadPromises = thumbnails.map((thumb) =>
        cloudinary.uploader.upload(thumb, { folder: "products/thumbnails" })
      );
      const results = await Promise.all(uploadPromises);
      thumbnailUrls = results.map((r) => r.secure_url);
    }

    const productData = {
      name,
      description,
      price,
      category,
      image: mainImageUrl,
      thumbnails: thumbnailUrls,
      isPreOrder: isPreOrder || "None", // ✅ lưu đúng giá trị chuỗi
      ...(category === "feedback" && { productLink }),
    };

    const newProduct = await Product.create(productData);
    await clearFeaturedCache();
    res.status(201).json(newProduct);
  } catch (error) {
    console.log("Error in createProduct ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update product --------------------
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image, thumbnails, productLink, isPreOrder } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // ----- Ảnh chính -----
    let newImage = product.image;
    if (image && image.startsWith("data:image")) {
      // Xóa ảnh cũ
      if (product.image) {
        const publicId = getPublicId(product.image);
        if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
      }
      // Upload ảnh mới
      const uploaded = await cloudinary.uploader.upload(image, { folder: "products" });
      newImage = uploaded.secure_url;
    }

    // ----- Thumbnails -----
    let newThumbnails = thumbnails || [];

    // Tìm thumbnail bị xóa và remove Cloudinary
    const deletedThumbs = product.thumbnails.filter((t) => !newThumbnails.includes(t));
    for (const url of deletedThumbs) {
      const publicId = getPublicId(url);
      if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }

    // Upload thumbnail mới (base64)
    const uploadedThumbs = await Promise.all(
      newThumbnails
        .filter((t) => t.startsWith("data:image"))
        .map((t) => cloudinary.uploader.upload(t, { folder: "products/thumbnails" }))
    );

    // Kết hợp thumbnail còn lại (URL cũ) + thumbnail mới
    const finalThumbnails = [
      ...newThumbnails.filter((t) => !t.startsWith("data:image")),
      ...uploadedThumbs.map((u) => u.secure_url),
    ];

    // ----- Cập nhật product -----
    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        category,
        image: newImage,
        thumbnails: finalThumbnails,
        productLink,
        isPreOrder: isPreOrder || "None", // ✅ cập nhật đúng giá trị chuỗi
      },
      { new: true }
    );

    await clearFeaturedCache();
    res.json(updated);
  } catch (error) {
    console.log("❌ Error in updateProduct ctrler:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Delete product --------------------
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "No product found" });

    if (product.image) {
      const publicId = getPublicId(product.image);
      if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }

    for (const thumb of product.thumbnails || []) {
      const publicId = getPublicId(thumb);
      if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }

    await Product.findByIdAndDelete(req.params.id);
    await clearFeaturedCache();
    res.json({ message: "✅ Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Toggle featured --------------------
export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    await updateFeaturedProductsCache();
    res.json(updatedProduct);
  } catch (error) {
    console.log("Error in toggleFeaturedProduct ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Toggle Pre-order --------------------
// ⚡️ Giờ dùng để luân chuyển giữa 4 trạng thái
export const togglePreOrderProduct = async (req, res) => {
  try {
    const { status } = req.body; // gửi lên "None" | "Pre-Order" | "Hết hàng" | "Số lượng còn ít"
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!["None", "Pre-Order", "Hết hàng", "Số lượng còn ít"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    product.isPreOrder = status;
    const updatedProduct = await product.save();

    res.json(updatedProduct);
  } catch (error) {
    console.log("Error in togglePreOrderProduct ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get products by category --------------------
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category });
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get recommended products --------------------
export const getRecommendedProducts = async (req, res) => {
  try {
    let { excludeIds = "" } = req.query;
    excludeIds = excludeIds ? excludeIds.split(",") : [];
    const excluded = excludeIds.map((id) => new mongoose.Types.ObjectId(id));

    const products = await Product.aggregate([
      {
        $match: {
          _id: { $nin: excluded },
          category: { $ne: "feedback" },
        },
      },
      { $sample: { size: 8 } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          thumbnails: 1,
          price: 1,
          category: 1,
          isPreOrder: 1,
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
