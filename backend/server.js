import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; // Import thêm fs để kiểm tra file tồn tại

// Import Routes
import bannerRoutes from "./routes/banner.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import userRoutes from "./routes/user.routes.js";
import { connectDB } from "./lib/db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình đường dẫn
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Cấu hình CORS
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
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", ordersRoutes);

// ---------------------------------------------------------------------
// 👇 PHẦN SỬA CHỮA: CẤU HÌNH FALLBACK CHO SPA (REACT)
// ---------------------------------------------------------------------

// 1. Xác định chính xác đường dẫn đến thư mục build frontend
// __dirname đang ở backend/, cần lùi ra ngoài 1 cấp (..) rồi vào frontend/dist
const frontendDistPath = path.join(__dirname, "../frontend/dist");

console.log("📂 Static files path:", frontendDistPath); // Log để kiểm tra trên Render

// 2. Phục vụ file tĩnh
app.use(express.static(frontendDistPath));

// 3. XỬ LÝ RELOAD TRANG (SPA Fallback)
// Sử dụng Regex /.*/ thay vì "*" để tránh lỗi PathError và bắt TẤT CẢ request
app.get(/.*/, (req, res) => {
  const indexPath = path.join(frontendDistPath, "index.html");
  
  // Kiểm tra xem file index.html có thực sự tồn tại không
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error("❌ Error: index.html not found at", indexPath);
    res.status(404).send("Server Error: Frontend build not found. Please check deployment logs.");
  }
});

// ---------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});