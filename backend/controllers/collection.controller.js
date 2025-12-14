import Collection from "../models/collection.model.js";

export const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find()
      .select("-products") 
      .lean() // ✅ QUAN TRỌNG: Tăng tốc độ đọc DB
      .sort({ createdAt: -1 });
    res.json(collections);
  } catch (err) {
    console.error("❌ Lỗi getAllCollections:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Detail Page: Lấy sản phẩm tối ưu
export const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate({
        path: "products",
        // ✅ Chỉ lấy trường cần thiết
        select: "name price image isSale salePercentage isPreOrder category productLink" 
      })
      .lean(); // ✅ Tăng tốc

    if (!collection) return res.status(404).json({ message: "Not found" });
    res.json(collection);
  } catch (err) {
    console.error("❌ Lỗi getCollectionById:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCollection = async (req, res) => {
  try {
    // ✅ CẬP NHẬT: Nhận thêm isFullSize và generalScale
    const { 
      name, description, coverMedia, gradientFrom, gradientTo, 
      isSpecial, specialPosition, 
      desktopWidth, desktopHeight, mobileWidth, mobileHeight, 
      hideName, hideDescription,
      isFullSize, generalScale // <--- MỚI
    } = req.body;

    const newCol = await Collection.create({
      name, description, coverMedia,
      gradientFrom: gradientFrom || "#3b82f6", 
      gradientTo: gradientTo || "#06b6d4",
      isSpecial: isSpecial || false,
      specialPosition: specialPosition || "below_banner",
      
      desktopWidth: desktopWidth || 100,
      desktopHeight: desktopHeight || 600,
      mobileWidth: mobileWidth || 100,
      mobileHeight: mobileHeight || 400,

      // ✅ Lưu cấu hình Full Size
      isFullSize: isFullSize || false,
      generalScale: generalScale || 100,

      hideName: hideName || false,
      hideDescription: hideDescription || false,
      products: [],
    });

    res.status(201).json(newCol);
  } catch (err) {
    console.error("❌ Lỗi createCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ MỚI: Hàm Update Collection
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    
    // Tìm và update, trả về dữ liệu mới (new: true)
    const updatedCol = await Collection.findByIdAndUpdate(id, updatedData, { new: true });
    
    if (!updatedCol) return res.status(404).json({ message: "Not found" });
    
    res.json(updatedCol);
  } catch (err) {
    console.error("❌ Lỗi updateCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const deleteCollection = async (req, res) => {
  try {
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
    const collection = await Collection.findById(id);
    if (!collection) return res.status(404).json({ message: "Not found" });

    if (collection.products.some((p) => p._id === product._id)) {
      return res
        .status(400)
        .json({ message: "Sản phẩm đã tồn tại trong collection" });
    }

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

    collection.products = collection.products.filter((p) => p._id !== productId);
    await collection.save();
    res.json(collection);
  } catch (err) {
    console.error("❌ Lỗi removeProductFromCollection:", err);
    res.status(500).json({ message: "Server error" });
  }
};