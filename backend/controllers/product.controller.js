import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import { redis } from "../lib/redis.js";
import mongoose from "mongoose";

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
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
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

    if (!featuredProducts.length) {
      return res.status(404).json({ message: "No featured products found" });
    }

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
    const { name, description, price, image, category, thumbnails } = req.body;

    let cloudinaryResponse = null;
    let thumbnailUrls = [];

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    if (thumbnails && Array.isArray(thumbnails)) {
      const uploadPromises = thumbnails.map((thumb) =>
        cloudinary.uploader.upload(thumb, { folder: "products/thumbnails" })
      );
      const uploadResults = await Promise.all(uploadPromises);
      thumbnailUrls = uploadResults.map((res) => res.secure_url);
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url || "",
      thumbnails: thumbnailUrls,
      category,
    });

    await clearFeaturedCache();

    res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Delete product --------------------
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "No product found" });
    }

    // Delete main image
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("🗑️ Deleted main image from Cloudinary");
      } catch (error) {
        console.log("⚠️ Error deleting main image", error);
      }
    }

    // Delete thumbnails
    if (product.thumbnails && product.thumbnails.length > 0) {
      for (let thumb of product.thumbnails) {
        const publicId = thumb.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`products/thumbnails/${publicId}`);
          console.log("🗑️ Deleted thumbnail:", publicId);
        } catch (error) {
          console.log("⚠️ Error deleting thumbnail", error);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    await clearFeaturedCache();

    res.json({ message: "✅ Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Toggle featured product --------------------
export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProductsCache();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProduct ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get products by category --------------------
export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const products = await Product.find({ category });
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get recommended products (PeopleAlsoBought) --------------------
export const getRecommendedProducts = async (req, res) => {
  try {
    // excludeIds từ query string: ?excludeIds=id1,id2
    let { excludeIds = "" } = req.query;
    excludeIds = excludeIds ? excludeIds.split(",") : [];
    const excluded = excludeIds.map((id) => new mongoose.Types.ObjectId(id));

    let products = await Product.aggregate([
      { $match: { _id: { $nin: excluded } } },
      { $sample: { size: 8 } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          thumbnails: 1,
          price: 1,
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
