import express from "express";
import { getProduction, saveProduction, getAllProductions, verifyPassword } from "../controllers/production.controller.js";

const router = express.Router();

router.get("/", getAllProductions);

// Route cố định phải nằm TRÊN các route có tham số (/:productId)
router.post("/verify-password", verifyPassword);

router.get("/:productId", getProduction);
router.post("/:productId", saveProduction);

export default router;