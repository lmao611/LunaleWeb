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

const router = express.Router();

router.get("/", getAllCollections);
router.get("/:id", getCollectionById);
router.post("/", createCollection);


router.put("/:id", updateCollection); 

router.delete("/:id", deleteCollection);
router.post("/:id/products", addProductToCollection);
router.delete("/:id/products/:productId", removeProductFromCollection);

export default router;