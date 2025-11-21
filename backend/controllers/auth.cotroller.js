import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

// =======================
// 🔹 TOKEN UTILITIES
// =======================
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

const setCookies = (res, accessToken, refreshToken) => {
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 60 * 60 * 1000, // 1h
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });
};

// =======================
// 🔹 FACEBOOK LOGIN
// =======================
export const facebookLogin = async (req, res) => {
    try {
        const { accessToken: fbToken } = req.body; // Đổi tên để tránh trùng
        if (!fbToken) {
            return res.status(400).json({ message: "Access token is required" });
        }

        const fbResponse = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email&access_token=${fbToken}`
        );
        const fbData = await fbResponse.json();

        if (fbData.error) {
            return res.status(400).json({ message: "Invalid Facebook token" });
        }

        let user = await User.findOne({ email: fbData.email });

        if (!user) {
            user = await User.create({
                name: fbData.name,
                email: fbData.email || `${fbData.id}@facebook.com`,
                provider: "facebook",
                facebookId: fbData.id,
            });
        }

        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        res.json({
            message: "Facebook login successful",
            accessToken, // ✅ Trả về để FE lưu localStorage
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                role: user.role,
            },
        });
    } catch (error) {
        console.log("Error in facebookLogin:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// =======================
// 🔹 SIGNUP
// =======================
export const signup = async (req, res) => {
    const { email, password, name, phoneNumber, direction } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ name, email, password, phoneNumber, direction });
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            accessToken, // ✅ Trả về để FE lưu localStorage
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                direction: user.direction,
                role: user.role,
            },
            message: "User created successfully",
        });
    } catch (error) {
        console.log("Error in signup controller:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// =======================
// 🔹 LOGIN
// =======================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateTokens(user._id);
            await storeRefreshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);

            res.json({
                accessToken, // ✅ Trả về để FE lưu localStorage
                _id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                direction: user.direction,
                role: user.role,
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.log("Error in login controller:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// =======================
// 🔹 LOGOUT
// =======================
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.userId}`);
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// =======================
// 🔹 REFRESH TOKEN
// =======================
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

        if (storedToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" } // ✅ Đồng bộ thời gian 1h với generateTokens
        );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 1000, // 1h
        });

        res.json({ 
            message: "Token refreshed successfully",
            accessToken // ✅ Trả về để FE cập nhật localStorage khi refresh
        });
    } catch (error) {
        console.log("Error in refreshToken:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// =======================
// 🔹 PROFILE
// =======================
export const getProfile = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// =======================
// 🔹 UPDATE PROFILE
// =======================
export const updateProfile = async (req, res) => {
    try {
        const { name, email, phoneNumber, direction } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, email, phoneNumber, direction },
            { new: true }
        ).select("-password");

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};