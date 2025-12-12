import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        let accessToken = req.cookies.accessToken;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            accessToken = req.headers.authorization.split(" ")[1];
        }

        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized - No access token provided" });
        }

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }
            req.user = user;
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Unauthorized - Access token expired" });
            }
            throw error;
        }
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized - Invalid access token" });
    }
};

export const adminRoute = async (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "controller")) {
        next();
    } else {
        return res.status(403).json({ message: "Access denied - Admin or Controller only" });
    }
};