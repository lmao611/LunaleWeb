import express from "express";
import {
  getAllCollections,
  getCollectionById,
  createCollection,
  deleteCollection,
  addProductToCollection,
  removeProductFromCollection
} from "../controllers/collection.controller.js";

const router = express.Router();

router.get("/", getAllCollections);
router.get("/:id", getCollectionById);
router.post("/", createCollection);
router.delete("/:id", deleteCollection);

router.post("/:id/products", addProductToCollection);
router.delete("/:id/products/:productId", removeProductFromCollection);

export default router;
