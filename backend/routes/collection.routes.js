import express from "express";
import { 
  getAllCollections, 
  createCollection, 
  deleteCollection, 
  getCollectionById,
  addProductToCollection,
  removeProductFromCollection,
  updateCollection 
} from "../controllers/collection.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllCollections);
router.get("/:id", getCollectionById);
router.post("/", protectRoute, adminRoute, createCollection);

router.put("/:id", protectRoute, adminRoute, updateCollection); 

router.delete("/:id", protectRoute, adminRoute, deleteCollection);
router.post("/:id/products", protectRoute, adminRoute, addProductToCollection);
router.delete("/:id/products/:productId", protectRoute, adminRoute, removeProductFromCollection);

export default router;