import express from "express";
import { getProduction, saveProduction } from "../controllers/production.controller.js";

const router = express.Router();

router.get("/:productId", getProduction);
router.post("/:productId", saveProduction);

export default router;