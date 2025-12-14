import Collection from "../models/collection.model.js";
import cloudinary from "../lib/cloudinary.js"; 

// 1. Lấy tất cả collection (Đã tối ưu nhẹ)
export const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find()
      .select("-products") // Giữ dòng này để load nhanh
      .lean()
      .sort({ createdAt: -1 });
    res.json(collections);
  } catch (err) {
    console.error("❌ Lỗi getAllCollections:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Lấy chi tiết collection
export const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate({
         path: "products",
         select: "name price image isSale salePercentage isPreOrder category productLink",
      });
      
    if (!collection) return res.status(404).json({ message: "Not found" });
    res.json(collection);
  } catch (err) {
    console.error("❌ Lỗi getCollectionById:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Tạo collection mới (Đã có logic upload Cloudinary)
export const createCollection = async (req, res) => {
  try {
    const { name, description, coverMedia, gradientFrom, gradientTo } = req.body;

    let mediaUrl = "";
    let mediaType = "image"; 

    // Upload lên Cloudinary nếu là Base64
    if (coverMedia && coverMedia.url) {
        if (coverMedia.url.startsWith("data:")) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(coverMedia.url, {
                    folder: "collections",
                    resource_type: "auto" 
                });
                mediaUrl = uploadResponse.secure_url;
                mediaType = uploadResponse.resource_type; 
            } catch (uploadError) {
                console.error("❌ Lỗi upload Cloudinary:", uploadError);
                return res.status(500).json({ message: "Lỗi khi upload ảnh/video" });
            }
        } else {
            mediaUrl = coverMedia.url;
            mediaType = coverMedia.type || "image";
        }
    }

    const newCol = await Collection.create({
      name,
      description,
      coverMedia: {
          url: mediaUrl,
          type: mediaType
      },
      gradientFrom: gradientFrom || "#3b82f6",
      gradientTo: gradientTo || "#06b6d4",
      products: [],
    });

    res.status(201).json(newCol);
  } catch (err) {
    console.error("❌ Lỗi createCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 4. Cập nhật Collection (HÀM BỊ THIẾU TRƯỚC ĐÓ)
export const updateCollection = async (req, res) => {
  try {
    const { name, description, coverMedia, gradientFrom, gradientTo } = req.body;
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // Cập nhật thông tin cơ bản
    collection.name = name || collection.name;
    collection.description = description || collection.description;
    collection.gradientFrom = gradientFrom || collection.gradientFrom;
    collection.gradientTo = gradientTo || collection.gradientTo;

    // Logic upload Cloudinary cho Update
    if (coverMedia && coverMedia.url) {
      // Nếu là ảnh mới (Base64) thì upload
      if (coverMedia.url.startsWith("data:")) {
        try {
            // (Optional) Xóa ảnh cũ trên cloud nếu cần, ở đây tôi bỏ qua để an toàn
            const uploadResponse = await cloudinary.uploader.upload(coverMedia.url, {
                folder: "collections",
                resource_type: "auto"
            });
            collection.coverMedia = {
                url: uploadResponse.secure_url,
                type: uploadResponse.resource_type
            };
        } catch (error) {
            console.error("❌ Lỗi upload update:", error);
            return res.status(500).json({ message: "Upload failed" });
        }
      } else {
        // Nếu là link cũ thì giữ nguyên (hoặc cập nhật type nếu có)
        collection.coverMedia = coverMedia; 
      }
    }

    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (err) {
    console.error("❌ Lỗi updateCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 5. Xóa Collection
export const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: "Not found" });

    // Xóa trên Cloudinary nếu có (để sạch data)
    if (collection.coverMedia && collection.coverMedia.url) {
        try {
            const url = collection.coverMedia.url;
            const publicId = url.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy("collections/" + publicId);
        } catch (e) {
            console.log("Ignored cloud delete error");
        }
    }

    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Lỗi deleteCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 6. Thêm sản phẩm vào collection
export const addProductToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const product = req.body;
    
    const collection = await Collection.findById(id);
    if (!collection) return res.status(404).json({ message: "Not found" });

    const exists = collection.products.some((p) => p.toString() === product._id || p._id?.toString() === product._id);
    
    if (exists) {
      return res.status(400).json({ message: "Sản phẩm đã tồn tại trong collection" });
    }

    collection.products.push(product); 
    
    await collection.save();
    res.json(collection);
  } catch (err) {
    console.error("❌ Lỗi addProductToCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 7. Xóa sản phẩm khỏi collection
export const removeProductFromCollection = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const collection = await Collection.findById(id);
    if (!collection) return res.status(404).json({ message: "Not found" });

    collection.products = collection.products.filter((p) => 
        p._id.toString() !== productId && p.toString() !== productId
    );
    
    await collection.save();
    res.json(collection);
  } catch (err) {
    console.error("❌ Lỗi removeProductFromCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};