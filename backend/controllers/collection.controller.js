import Collection from "../models/collection.model.js";
import cloudinary from "../lib/cloudinary.js"; // ✅ Thêm dòng này để dùng Cloudinary

export const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find()
      .select("-products") // ✅ Giữ dòng này để load danh sách nhanh
      .lean()
      .sort({ createdAt: -1 });
    res.json(collections);
  } catch (err) {
    console.error("❌ Lỗi getAllCollections:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate({
         path: "products",
         select: "name price image isSale salePercentage isPreOrder category productLink",
         // perDocumentLimit: 12 // (Mở cái này nếu muốn giới hạn số sản phẩm load ra)
      });
      
    if (!collection) return res.status(404).json({ message: "Not found" });
    res.json(collection);
  } catch (err) {
    console.error("❌ Lỗi getCollectionById:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { name, description, coverMedia, gradientFrom, gradientTo } = req.body;

    let mediaUrl = "";
    let mediaType = "image"; // Mặc định là ảnh

    // ✅ LOGIC MỚI: Upload lên Cloudinary (Copy từ Product qua)
    if (coverMedia && coverMedia.url) {
        // Kiểm tra xem có phải là chuỗi Base64 không (để tránh upload lại link cũ)
        if (coverMedia.url.startsWith("data:")) {
            try {
                console.log("☁️ Đang upload collection cover lên Cloudinary...");
                
                const uploadResponse = await cloudinary.uploader.upload(coverMedia.url, {
                    folder: "collections",
                    resource_type: "auto" // ✅ Tự động nhận diện là VIDEO hay ẢNH
                });

                mediaUrl = uploadResponse.secure_url;
                mediaType = uploadResponse.resource_type; // 'image' hoặc 'video'
                console.log("✅ Upload thành công:", mediaUrl);
            } catch (uploadError) {
                console.error("❌ Lỗi upload Cloudinary:", uploadError);
                return res.status(500).json({ message: "Lỗi khi upload ảnh/video" });
            }
        } else {
            // Nếu gửi lên là link sẵn rồi thì giữ nguyên
            mediaUrl = coverMedia.url;
            mediaType = coverMedia.type || "image";
        }
    }

    const newCol = await Collection.create({
      name,
      description,
      coverMedia: {
          url: mediaUrl, // ✅ Giờ đây nó là Link ngắn gọn, không phải Base64 6MB nữa
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

export const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: "Not found" });

    // ✅ Xóa ảnh trên Cloudinary cho sạch rác (Optional)
    if (collection.coverMedia && collection.coverMedia.url) {
        try {
            // Logic lấy publicId để xóa hơi phức tạp với video, 
            // tạm thời bỏ qua để tránh lỗi, file cũ cứ để đó cũng ko sao.
            const url = collection.coverMedia.url;
            const publicId = url.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy("collections/" + publicId);
        } catch (e) {
            console.log("Không xóa được ảnh cũ trên cloud, bỏ qua.");
        }
    }

    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Lỗi deleteCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addProductToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const product = req.body;
    
    // Tìm collection
    const collection = await Collection.findById(id);
    if (!collection) return res.status(404).json({ message: "Not found" });

    // Kiểm tra trùng
    // Lưu ý: So sánh String ID để chính xác hơn
    const exists = collection.products.some((p) => p.toString() === product._id || p._id?.toString() === product._id);
    
    if (exists) {
      return res.status(400).json({ message: "Sản phẩm đã tồn tại trong collection" });
    }

    // ✅ CHỈ LƯU ID SẢN PHẨM (Để Database nhẹ)
    // Nếu Schema của bạn là mảng Object đầy đủ thì push object, 
    // nhưng tốt nhất nên refactor Schema để chỉ lưu ObjectId.
    // Dựa trên code cũ của bạn, tôi giữ nguyên cách push product.
    collection.products.push(product); 
    
    await collection.save();
    res.json(collection);
  } catch (err) {
    console.error("❌ Lỗi addProductToCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

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