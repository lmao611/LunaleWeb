import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; // Thêm thư viện fs để kiểm tra file

import bannerRoutes from "./routes/banner.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import { connectDB } from "./lib/db.js";
import ordersRoutes from "./routes/orders.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

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
        // Cho phép request từ Postman hoặc Server-to-Server
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", ordersRoutes);

// ---------------------------------------------------------------------
// 👇 PHẦN CẦN THÊM ĐỂ FIX LỖI ROUTING VÀ RELOAD
// ---------------------------------------------------------------------

// Xác định đường dẫn tới thư mục build của Frontend
const frontendDistPath = path.join(__dirname, "../frontend/dist");

// 1. Phục vụ file tĩnh (JS, CSS, Ảnh...)
app.use(express.static(frontendDistPath));

// 2. Chốt chặn cuối cùng: Trả về index.html cho mọi request không phải API
// Sử dụng app.use không tham số để bắt tất cả request còn sót lại
app.use((req, res) => {
  const indexPath = path.join(frontendDistPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Nếu chưa build frontend thì báo lỗi rõ ràng thay vì crash
    res.status(404).send("Frontend build not found. Please run 'npm run build' in frontend folder.");
  }
});
// ---------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});