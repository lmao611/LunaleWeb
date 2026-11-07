import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import Collection from "../models/collection.model.js";
import { redis } from "../lib/redis.js";
import mongoose from "mongoose";

const getPublicId = (url) => {
  if (typeof url !== "string") return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[^/.]+$/);
  return match ? match[1] : null;
};

/**
 * Ảnh đã nằm sẵn trên Cloudinary (trình duyệt upload trực tiếp).
 * Chỉ chấp nhận https + host cloudinary để tránh lưu URL lạ vào DB.
 */
const isCloudinaryUrl = (value) =>
  typeof value === "string" &&
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\//i.test(value);

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
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }

    featuredProducts = await Product.find({ isFeatured: true, isHidden: { $ne: true } }).lean();
    if (!featuredProducts.length)
      return res.status(404).json({ message: "No featured products found" });

    await redis.set("featured_products", JSON.stringify(featuredProducts));
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, thumbnails, productLink, isPreOrder, isSale, salePercentage, isHidden } = req.body;

    let mainImageUrl = "";
    let thumbnailUrls = [];

    if (image) {
      // Ảnh có thể đến từ 2 nguồn:
      //  - URL Cloudinary (trình duyệt upload trực tiếp)  -> dùng luôn
      //  - data:image/... (client cũ)                      -> server upload
      if (isCloudinaryUrl(image)) {
        mainImageUrl = image;
      } else {
        const uploadedMain = await cloudinary.uploader.upload(image, { folder: "products" });
        mainImageUrl = uploadedMain.secure_url;
      }
    }

    if (Array.isArray(thumbnails) && thumbnails.length) {
      thumbnailUrls = await Promise.all(
        thumbnails.slice(0, 12).map(async (thumb) => {
          if (isCloudinaryUrl(thumb)) return thumb;
          const uploaded = await cloudinary.uploader.upload(thumb, {
            folder: "products/thumbnails",
          });
          return uploaded.secure_url;
        })
      );
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
      isHidden: isHidden || false,
      order: 0,
      ...(category === "feedback" && { productLink }),
    };

    const newProduct = await Product.create(productData);
    await clearFeaturedCache();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image, thumbnails, productLink, isPreOrder, isSale, salePercentage, isHidden } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let newImage = product.image;

    if (image && isCloudinaryUrl(image) && image !== product.image) {
      // Ảnh đã upload trực tiếp từ trình duyệt -> dùng luôn, xoá ảnh cũ
      if (product.image) {
        const publicId = getPublicId(product.image);
        if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
      }
      newImage = image;
    } else if (image && image.startsWith("data:image")) {
      if (product.image) {
        const publicId = getPublicId(product.image);
        if (publicId) await cloudinary.uploader.destroy(publicId, { invalidate: true });
      }
      const uploaded = await cloudinary.uploader.upload(image, { folder: "products" });
      newImage = uploaded.secure_url;
    }

    const newThumbnails = Array.isArray(thumbnails)
      ? thumbnails.filter((t) => typeof t === "string" && t)
      : [];

    const deletedThumbs = (product.thumbnails || []).filter((t) => !newThumbnails.includes(t));
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
        isHidden: isHidden !== undefined ? isHidden : product.isHidden,
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
          "products.$.productLink": updated.productLink,
          "products.$.isHidden": updated.isHidden
        }
      }
    );

    await clearFeaturedCache();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || String(query).trim() === "") {
      return res.json({ products: [] });
    }

    // Escape ký tự đặc biệt của regex: tránh ReDoS / regex injection
    const safeQuery = String(query)
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const products = await Product.find({
      name: { $regex: safeQuery, $options: "i" },
      category: { $ne: "feedback" },
      isHidden: { $ne: true }
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category }).sort({ order: 1, createdAt: -1 });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    let { excludeIds = "" } = req.query;
    excludeIds = excludeIds ? String(excludeIds).split(",").slice(0, 30) : [];
    // Bỏ qua id không hợp lệ (trước đây new ObjectId() sẽ throw -> 500)
    const excluded = excludeIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const products = await Product.aggregate([
      {
        $match: {
          _id: { $nin: excluded },
          category: { $ne: "feedback" },
          isSale: { $ne: true },
          isHidden: { $ne: true }
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
          isHidden: 1
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};