import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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

// Cấu hình đường dẫn cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Middleware cơ bản
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
        callback(null, true); // Chấp nhận request từ Postman/Server-to-Server
      }
    },
    credentials: true,
  })
);

// --- API Routes (Ưu tiên xử lý trước) ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", ordersRoutes);

// --- Cấu hình Deployment (QUAN TRỌNG) ---
if (process.env.NODE_ENV === "production") {
  // 1. Phục vụ file tĩnh (JS, CSS, Ảnh) từ thư mục frontend/dist
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // 2. FALLBACK HANDLER (Chốt chặn cuối cùng)
  // Lưu ý: Dùng app.use KHÔNG CÓ path để tránh lỗi PathError của Express 5
  // Bất kỳ request nào không khớp API ở trên và không phải file tĩnh sẽ lọt vào đây
  app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});