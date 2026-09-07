import express from "express";
import { trackVisit, getDailyVisits } from "../controllers/analytics.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/track", trackVisit);
router.get("/daily", protectRoute, adminRoute, getDailyVisits);

export default router;