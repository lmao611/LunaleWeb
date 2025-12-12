import express from "express";
import { 
  getAllCollections, 
  createCollection, 
  deleteCollection, 
  getCollectionById,
  addProductToCollection,
  removeProductFromCollection,
  updateCollection // <--- Nhớ import cái này
} from "../controllers/collection.controller.js";

const router = express.Router();

router.get("/", getAllCollections);
router.get("/:id", getCollectionById);
router.post("/", createCollection);

// ✅ THÊM DÒNG NÀY ĐỂ SỬA LỖI KHÔNG LƯU ĐƯỢC
router.put("/:id", updateCollection); 

router.delete("/:id", deleteCollection);
router.post("/:id/products", addProductToCollection);
router.delete("/:id/products/:productId", removeProductFromCollection);

export default router;