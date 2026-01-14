import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};


const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
    };
};

const setCookies = (res, accessToken, refreshToken) => {
    const options = getCookieOptions();

    res.cookie("accessToken", accessToken, {
        ...options,
        maxAge: 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        ...options,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const facebookLogin = async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) return res.status(400).json({ message: "Access token is required" });

        const fbResponse = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
        );
        const fbData = await fbResponse.json();

        if (fbData.error) return res.status(400).json({ message: "Invalid Facebook token" });

        let user = await User.findOne({ email: fbData.email });

        if (!user) {
            user = await User.create({
                name: fbData.name,
                email: fbData.email || `${fbData.id}@facebook.com`,
                provider: "facebook",
                facebookId: fbData.id,
            });
        }

        const { accessToken: jwtAccess, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, jwtAccess, refreshToken);

        res.json({
            accessToken: jwtAccess,
            message: "Facebook login successful",
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
            accessToken,
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

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateTokens(user._id);
            await storeRefreshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);

            res.json({
                accessToken,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    direction: user.direction,
                    role: user.role,
                },
            });
        } else {
            res.status(401).json({ message: "Mật khẩu hoặc tên tài khoản không đúng" });
        }
    } catch (error) {
        console.log("Error in login controller:", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                await redis.del(`refresh_token:${decoded.userId}`);
            } catch (err) {
                console.log("Token invalid during logout, ignoring redis deletion");
            }
        }

        const options = getCookieOptions();
        res.clearCookie("accessToken", options);
        res.clearCookie("refreshToken", options);
        
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

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
            { expiresIn: "15m" }
        );

        const options = getCookieOptions();
        res.cookie("accessToken", accessToken, {
            ...options,
            maxAge: 15 * 60 * 1000,
        });

        res.json({ message: "Token refreshed successfully", accessToken });
    } catch (error) {
        console.log("Error in refreshToken:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

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

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        res.json(users);
    } catch (error) {
        console.log("Error in getAllUsers controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};