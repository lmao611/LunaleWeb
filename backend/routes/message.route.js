import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const router = express.Router();

const handleGuestAuth = async (req, res, next) => {
    const token = req.cookies?.jwt;
    if (token) {
        return protectRoute(req, res, next);
    }

    if (req.method === "POST" && req.body && req.body.guestInfo) {
        try {
            const { phone, name } = req.body.guestInfo;
            const email = `${phone}@guest.lunale.com`;
            let user = await User.findOne({ email });

            if (!user) {
                user = await User.create({
                    name: `${name} (Khách)`,
                    email,
                    password: Math.random().toString(36).slice(-8),
                    role: "customer"
                });
            }

            const newToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });

            res.cookie("jwt", newToken, {
                maxAge: 7 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV !== "development",
            });

            req.user = user;
            return next();
        } catch (error) {
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    if (req.method === "GET") {
        req.user = null;
        return next();
    }

    return res.status(401).json({ error: "Unauthorized" });
};

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", handleGuestAuth, getMessages);
router.post("/send/:id", handleGuestAuth, sendMessage);

export default router;