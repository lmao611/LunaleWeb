import Collection from "../models/collection.model.js";
import cloudinary from "../lib/cloudinary.js"; 

// 1. Lấy tất cả collection
export const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find()
      .select("-products") 
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

// 3. Tạo collection mới (Đã bổ sung Special Fields)
export const createCollection = async (req, res) => {
  try {
    // 👇 LẤY THÊM CÁC TRƯỜNG SPECIAL TỪ REQ.BODY
    const { 
        name, description, coverMedia, gradientFrom, gradientTo,
        isSpecial, specialPosition, 
        mobileWidth, mobileHeight, desktopWidth, desktopHeight,
        isFullSize, hideName, hideDescription
    } = req.body;

    let mediaUrl = "";
    let mediaType = "image"; 

    // Logic upload Cloudinary
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
      // 👇 LƯU CÁC TRƯỜNG SPECIAL VÀO DB
      isSpecial: isSpecial || false,
      specialPosition: specialPosition || "below_featured",
      mobileWidth: mobileWidth || 100,
      mobileHeight: mobileHeight || 400,
      desktopWidth: desktopWidth || 100,
      desktopHeight: desktopHeight || 600,
      isFullSize: isFullSize || false,
      hideName: hideName || false,
      hideDescription: hideDescription || false,
    });

    res.status(201).json(newCol);
  } catch (err) {
    console.error("❌ Lỗi createCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 4. Cập nhật Collection (Đã bổ sung Special Fields)
export const updateCollection = async (req, res) => {
  try {
    const { 
        name, description, coverMedia, gradientFrom, gradientTo,
        isSpecial, specialPosition, 
        mobileWidth, mobileHeight, desktopWidth, desktopHeight,
        isFullSize, hideName, hideDescription
    } = req.body;

    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // Cập nhật thông tin cơ bản
    collection.name = name || collection.name;
    collection.description = description || collection.description;
    collection.gradientFrom = gradientFrom || collection.gradientFrom;
    collection.gradientTo = gradientTo || collection.gradientTo;

    // 👇 CẬP NHẬT CÁC TRƯỜNG SPECIAL (Kiểm tra undefined để cho phép set false/0)
    if (isSpecial !== undefined) collection.isSpecial = isSpecial;
    if (specialPosition !== undefined) collection.specialPosition = specialPosition;
    if (mobileWidth !== undefined) collection.mobileWidth = mobileWidth;
    if (mobileHeight !== undefined) collection.mobileHeight = mobileHeight;
    if (desktopWidth !== undefined) collection.desktopWidth = desktopWidth;
    if (desktopHeight !== undefined) collection.desktopHeight = desktopHeight;
    if (isFullSize !== undefined) collection.isFullSize = isFullSize;
    if (hideName !== undefined) collection.hideName = hideName;
    if (hideDescription !== undefined) collection.hideDescription = hideDescription;

    // Logic upload Cloudinary cho Update
    if (coverMedia && coverMedia.url) {
      if (coverMedia.url.startsWith("data:")) {
        try {
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

// 6. Thêm sản phẩm
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

// 7. Xóa sản phẩm
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