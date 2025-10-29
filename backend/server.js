import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bannerRoutes from "./routes/banner.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import { connectDB } from "./lib/db.js";
import ordersRoutes from "./routes/orders.routes.js";
import userRoutes from "./routes/user.routes.js";
import facebookRoutes from "./routes/facebook.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ✅ Sửa duy nhất phần CORS (phần còn lại giữ nguyên)
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/auth/facebook", facebookRoutes);

// ✅ Serve frontend (production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"));
  });
}

// ✅ HTTPS / HTTP setup
let server;
try {
  const sslKeyPath = path.resolve(__dirname, process.env.SSL_KEY || "");
  const sslCertPath = path.resolve(__dirname, process.env.SSL_CERT || "");

  if (!fs.existsSync(sslKeyPath) || !fs.existsSync(sslCertPath)) {
    throw new Error("SSL key/cert file not found");
  }

  const sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };

  server = https.createServer(sslOptions, app);
  server.listen(PORT, () => {
    console.log(`🚀 HTTPS Server running at https://localhost:${PORT}`);
    connectDB();
  });
} catch (err) {
  console.warn("⚠️ HTTPS failed, fallback to HTTP:", err.message);
  server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`🚀 HTTP Server running at http://localhost:${PORT}`);
    connectDB();
  });
}
