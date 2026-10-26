import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/** Xác thực bắt buộc */
export const protectRoute = async (req, res, next) => {
  try {
    let accessToken = req.cookies.accessToken;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      accessToken = req.headers.authorization.split(" ")[1];
    }

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized - No access token provided" });
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - Access token expired" });
    }
    return res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};

/**
 * Xác thực tuỳ chọn: có token hợp lệ thì gắn req.user,
 * không có / token hỏng thì vẫn cho đi tiếp (dùng cho route công khai
 * nhưng muốn biết người dùng là ai, ví dụ /analytics/track).
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let accessToken = req.cookies?.accessToken;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      accessToken = req.headers.authorization.split(" ")[1];
    }
    if (!accessToken) return next();

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (user) req.user = user;
    return next();
  } catch {
    return next();
  }
};

/** Chỉ admin hoặc controller */
export const adminRoute = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "controller")) {
    return next();
  }
  return res.status(403).json({ message: "Access denied - Admin or Controller only" });
};
