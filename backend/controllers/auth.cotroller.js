import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fetch from "node-fetch";
import cloudinary from "../lib/cloudinary.js";
import { emitToUser, emitToAdmins } from "../lib/socket.js";
import { getClientIp } from "../lib/requestIp.js";

const ACCESS_TOKEN_TTL = "1h";
const ACCESS_TOKEN_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL = "7d";
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
  return { accessToken, refreshToken };
};

/** Redis có thể chết — không được để login trả 500 vì nó */
const safeRedis = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (err) {
    console.error("[REDIS]", err.message);
    return fallback;
  }
};

const storeRefreshToken = async (userId, refreshToken) => {
  await safeRedis(() =>
    redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60)
  );
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
    maxAge: ACCESS_TOKEN_MS,
  });

  res.cookie("refreshToken", refreshToken, {
    ...options,
    maxAge: REFRESH_TOKEN_MS,
  });
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber,
  direction: user.direction,
  role: user.role,
  avatar: user.avatar,
});

const emailLockKey = (email) =>
  `login_lock:${crypto.createHash("sha256").update(email).digest("hex").slice(0, 32)}`;

const emailFailKey = (email) =>
  `login_fail:${crypto.createHash("sha256").update(email).digest("hex").slice(0, 32)}`;

const ipFailKey = (ip) => `login_fail_ip:${ip}`;

/* ------------------------------------------------------------------ */
/*  Facebook login                                                     */
/* ------------------------------------------------------------------ */

export const facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken || typeof accessToken !== "string") {
      return res.status(400).json({ message: "Access token is required" });
    }

    const fbResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
    );
    const fbData = await fbResponse.json();

    if (fbData.error) return res.status(400).json({ message: "Invalid Facebook token" });

    const email = typeof fbData.email === "string" ? fbData.email.toLowerCase().trim() : "";
    if (!email) {
      return res.status(400).json({
        message: "Tài khoản Facebook chưa có email. Vui lòng đăng ký bằng email.",
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      // KHÔNG tự động gắn Facebook vào tài khoản mật khẩu -> tránh chiếm tài khoản
      if (user.provider !== "facebook") {
        return res.status(409).json({
          message: "Email này đã có tài khoản. Vui lòng đăng nhập bằng email và mật khẩu.",
        });
      }
    } else {
      user = await User.create({
        name: fbData.name,
        email,
        provider: "facebook",
        facebookId: fbData.id,
        role: "customer",
      });
    }

    const { accessToken: jwtAccess, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, jwtAccess, refreshToken);

    res.json({
      accessToken: jwtAccess,
      message: "Facebook login successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("[FB LOGIN]", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------------------------ */
/*  Đăng ký                                                            */
/* ------------------------------------------------------------------ */

export const signup = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");
    const { phoneNumber, direction } = req.body;

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ message: "Tên phải từ 2 đến 60 ký tự" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }

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
      user: publicUser(user),
      message: "User created successfully",
    });
  } catch (error) {
    console.error("[SIGNUP]", error.message);
    res.status(500).json({ message: "Lỗi tạo tài khoản" });
  }
};

/* ------------------------------------------------------------------ */
/*  Đăng nhập                                                          */
/* ------------------------------------------------------------------ */

export const login = async (req, res) => {
  try {
    const ip = getClientIp(req);
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    // Khoá theo TÀI KHOẢN (không phụ thuộc IP) -> không thể né bằng X-Forwarded-For
    const lockKey = emailLockKey(email);
    const lockedUntil = await safeRedis(() => redis.get(lockKey));
    if (lockedUntil && Date.now() < parseInt(lockedUntil)) {
      const remaining = Math.ceil((parseInt(lockedUntil) - Date.now()) / 1000);
      return res.status(429).json({
        message: `Đăng nhập bị tạm khoá. Vui lòng thử lại sau ${remaining} giây.`,
      });
    }

    const user = email ? await User.findOne({ email }) : null;

    // Luôn so sánh mật khẩu (kể cả khi không có user) để giảm timing attack
    const passwordOk = user
      ? await user.comparePassword(password)
      : await new Promise((r) => setTimeout(() => r(false), 120));

    if (user && passwordOk) {
      await safeRedis(() => redis.del(emailFailKey(email)));
      await safeRedis(() => redis.del(ipFailKey(ip)));

      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      return res.json({ accessToken, user: publicUser(user) });
    }

    // Đếm theo email và theo IP
    const emailFails = await safeRedis(() => redis.incr(emailFailKey(email)));
    if (emailFails === 1) {
      await safeRedis(() => redis.expire(emailFailKey(email), 60 * 60));
    }
    const ipFails = await safeRedis(() => redis.incr(ipFailKey(ip)));
    if (ipFails === 1) {
      await safeRedis(() => redis.expire(ipFailKey(ip), 60 * 60));
    }

    const EMAIL_MAX = 8;
    const IP_MAX = 25;

    if ((typeof emailFails === "number" && emailFails >= EMAIL_MAX) ||
        (typeof ipFails === "number" && ipFails >= IP_MAX)) {
      const penalty = 15 * 60 * 1000;
      await safeRedis(() => redis.set(lockKey, Date.now() + penalty, "PX", penalty));
      await safeRedis(() => redis.del(emailFailKey(email)));
      await safeRedis(() => redis.del(ipFailKey(ip)));
      return res.status(429).json({
        message: "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
      });
    }

    return res.status(401).json({ message: "Mật khẩu hoặc tên tài khoản không đúng" });
  } catch (error) {
    console.error("[LOGIN]", error.message);
    res.status(500).json({ message: "Lỗi đăng nhập" });
  }
};

/* ------------------------------------------------------------------ */
/*  Đăng xuất / làm mới token                                          */
/* ------------------------------------------------------------------ */

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        await safeRedis(() => redis.del(`refresh_token:${decoded.userId}`));
      } catch {
        /* token hỏng thì bỏ qua */
      }
    }

    const options = getCookieOptions();
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("[LOGOUT]", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const storedToken = await safeRedis(() =>
      redis.get(`refresh_token:${decoded.userId}`)
    );

    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const options = getCookieOptions();
    res.cookie("accessToken", accessToken, {
      ...options,
      maxAge: ACCESS_TOKEN_MS,
    });

    res.json({ message: "Token refreshed successfully", accessToken });
  } catch (error) {
    console.error("[REFRESH]", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------------------------ */
/*  Hồ sơ cá nhân                                                      */
/* ------------------------------------------------------------------ */

export const getProfile = async (req, res) => {
  res.json(req.user);
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber, direction, avatar } = req.body;
    const userId = req.user._id;

    const updatedData = {};

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (cleanName.length < 2 || cleanName.length > 60) {
        return res.status(400).json({ message: "Tên phải từ 2 đến 60 ký tự" });
      }
      updatedData.name = cleanName;
    }

    if (email !== undefined) {
      const cleanEmail = String(email).toLowerCase().trim();
      if (!EMAIL_RE.test(cleanEmail)) {
        return res.status(400).json({ message: "Email không hợp lệ" });
      }
      const existing = await User.findOne({ email: cleanEmail, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
      updatedData.email = cleanEmail;
    }

    if (phoneNumber !== undefined) updatedData.phoneNumber = String(phoneNumber).slice(0, 20);
    if (direction !== undefined) updatedData.direction = String(direction).slice(0, 300);

    if (avatar) {
      if (typeof avatar !== "string" || avatar.length > 8 * 1024 * 1024) {
        return res.status(400).json({ message: "Ảnh quá lớn" });
      }
      try {
        const uploadResponse = await cloudinary.uploader.upload(avatar, {
          folder: "lunale_avatars",
        });
        updatedData.avatar = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("[AVATAR]", uploadError.message);
        return res.status(500).json({ message: "Lỗi tải ảnh lên server" });
      }
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    emitToUser(user._id, "userProfileUpdated", publicUser(user));
    emitToAdmins("userProfileUpdated", publicUser(user));

    res.json(user);
  } catch (error) {
    console.error("[UPDATE PROFILE]", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").lean();
    res.json(users);
  } catch (error) {
    console.error("[GET USERS]", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
