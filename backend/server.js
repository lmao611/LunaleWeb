import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

import { app, server } from "./lib/socket.js";
import { connectDB } from "./lib/db.js";
import { ipKey } from "./lib/requestIp.js";

import bannerRoutes from "./routes/banner.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import userRoutes from "./routes/user.routes.js";
import customerOrderRoutes from "./routes/customerOrder.routes.js";
import notificationRoutes from "./routes/notification.route.js";
import messageRoutes from "./routes/message.route.js";
import productionRoutes from "./routes/production.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

/* ------------------------------------------------------------------ */
/*  Cấu hình chung                                                     */
/* ------------------------------------------------------------------ */

// Không quảng cáo stack
app.disable("x-powered-by");

// Số hop proxy phía trước (Cloudflare + Render = 2). Có thể chỉnh bằng env.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 2));

// Header bảo mật cơ bản cho API
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (isProd) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// Giới hạn kích thước body: ảnh được gửi dạng base64 nên cần rộng,
// nhưng không nên để 15MB cho MỌI route.
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use(cookieParser());

/* ------------------------------------------------------------------ */
/*  CORS — whitelist tuyệt đối                                         */
/* ------------------------------------------------------------------ */

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://localhost:5173",
  "http://127.0.0.1:5173",
  "https://lunale.com.vn",
  "https://www.lunale.com.vn",
  ...(process.env.ADDITIONAL_ORIGINS || "").split(","),
]
  .map((o) => (o || "").trim().replace(/\/$/, ""))
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // curl / mobile app / same-origin
  return allowedOrigins.includes(origin.replace(/\/$/, ""));
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Trả false thay vì throw: request vẫn chạy nhưng KHÔNG có header CORS,
      // trình duyệt sẽ chặn đọc response. Tránh biến lỗi CORS thành 500.
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    maxAge: 86400,
  })
);

// Chặn CSRF: mọi request thay đổi dữ liệu đến từ origin lạ đều bị từ chối.
// (Cookie đang để SameSite=None vì API nằm ở subdomain/khác host.)
app.use((req, res, next) => {
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (!unsafe) return next();

  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ message: "Origin không được phép" });
  }
  next();
});

/* ------------------------------------------------------------------ */
/*  Rate limit toàn cục (chống spam/DoS nhẹ)                           */
/* ------------------------------------------------------------------ */

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau." },
  // Bỏ qua preflight
  skip: (req) => req.method === "OPTIONS",
});

const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKey,
  message: { message: "Bạn thao tác quá nhanh, vui lòng thử lại sau." },
  skip: (req) => req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS",
});

app.use("/api", globalLimiter);
app.use("/api", writeLimiter);

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/customer-orders", customerOrderRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.send("API Lunale is running");
});

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

/* ------------------------------------------------------------------ */
/*  404 + xử lý lỗi tập trung (không lộ chi tiết nội bộ)               */
/* ------------------------------------------------------------------ */

app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy tài nguyên" });
});

app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: "Lỗi server" });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
