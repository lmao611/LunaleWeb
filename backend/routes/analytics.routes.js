import express from "express";
import { trackVisit, getDailyVisits } from "../controllers/analytics.controller.js";

const router = express.Router();

router.post("/track", trackVisit);
router.get("/daily", getDailyVisits);

export default router;