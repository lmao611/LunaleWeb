import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import Collection from "../models/collection.model.js";
import { redis } from "../lib/redis.js";
import mongoose from "mongoose";

const getPublicId = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[^/.]+$/);
  return match ? match[1] : null;
};

async function clearFeaturedCache() {
  try {
    await redis.del("featured_products");
  } catch (err) {
    console.error(err);
  }
}

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.error(error);
  }
}

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ order: 1, createdAt: -1 });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const reorderProducts = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index },
      },
    }));

    await Product.bulkWrite(bulkOps);
    res.json({ message: "Products reordered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }

    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts.length)
      return res.status(404).json({ message: "No featured products found" });

    await redis.set("featured_products", JSON.stringify(featuredProducts));
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, thumbnails, productLink, isPreOrder, isSale, salePercentage } = req.body;

    let mainImageUrl = "";
    let thumbnailUrls = [];

    if (image) {
      const uploadedMain = await cloudinary.uploader.upload(image, { folder: "products" });
      mainImageUrl = uploadedMain.secure_url;
    }

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
      isPreOrder: isPreOrder || "None",
      isSale: isSale || false,
      salePercentage: isSale ? (salePercentage || 0) : 0,
      order: 0,
      ...(category === "feedback" && { productLink }),
    };

    const newProduct = await Product.create(productData);
    await clearFeaturedCache();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image, thumbnails, productLink, isPreOrder, isSale, salePercentage } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let newImage = product.image;
    if (image && image.startsWith("data:image")) {
      if (product.image) {
        const publicId = getPublicId(product.image);
        if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
      }
      const uploaded = await cloudinary.uploader.upload(image, { folder: "products" });
      newImage = uploaded.secure_url;
    }

    let newThumbnails = thumbnails || [];
    const deletedThumbs = product.thumbnails.filter((t) => !newThumbnails.includes(t));
    for (const url of deletedThumbs) {
      const publicId = getPublicId(url);
      if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }

    const uploadedThumbs = await Promise.all(
      newThumbnails
        .filter((t) => t.startsWith("data:image"))
        .map((t) => cloudinary.uploader.upload(t, { folder: "products/thumbnails" }))
    );

    const finalThumbnails = [
      ...newThumbnails.filter((t) => !t.startsWith("data:image")),
      ...uploadedThumbs.map((u) => u.secure_url),
    ];

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
        isPreOrder: isPreOrder || "None",
        isSale: isSale || false,
        salePercentage: isSale ? (salePercentage || 0) : 0,
      },
      { new: true }
    );

    await Collection.updateMany(
      { "products._id": id },
      {
        $set: {
          "products.$.name": updated.name,
          "products.$.price": updated.price,
          "products.$.image": updated.image,
          "products.$.isSale": updated.isSale,
          "products.$.salePercentage": updated.salePercentage,
          "products.$.isPreOrder": updated.isPreOrder,
          "products.$.category": updated.category,
          "products.$.productLink": updated.productLink
        }
      }
    );

    await clearFeaturedCache();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "No product found" });

    if (product.image) {
      const publicId = getPublicId(product.image);
      if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }

    for (const thumb of product.thumbnails || []) {
      const publicId = getPublicId(thumb);
      if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }

    await Product.findByIdAndDelete(id);

    await Collection.updateMany(
      { "products._id": id },
      { $pull: { products: { _id: id } } }
    );

    await clearFeaturedCache();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    await updateFeaturedProductsCache();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const togglePreOrderProduct = async (req, res) => {
  try {
    const { status } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!["None", "Pre-Order", "Hết hàng", "Số lượng còn ít"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    product.isPreOrder = status;
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Nếu không có từ khóa, trả về mảng rỗng (frontend sẽ tự hiện gợi ý)
    if (!query || query.trim() === "") {
      return res.json({ products: [] });
    }

    // Tìm kiếm theo tên (không phân biệt hoa thường), loại bỏ category 'feedback'
    const products = await Product.find({
      name: { $regex: query, $options: "i" },
      category: { $ne: "feedback" }
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category }).sort({ order: 1, createdAt: -1 });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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
          isSale: { $ne: true }
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
          isSale: 1,
          salePercentage: 1,
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};