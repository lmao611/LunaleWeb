import Collection from "../models/collection.model.js";


export const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    res.json(collections);
  } catch (err) {
    console.error("❌ Lỗi getAllCollections:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
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

    const newCol = await Collection.create({
      name,
      description,
      coverMedia,
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
