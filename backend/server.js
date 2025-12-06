import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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
      // ✅ SỬA: Cho phép origin từ mạng nội bộ (Wifi) để test trên điện thoại
      // Kiểm tra nếu origin bắt đầu bằng 192.168... hoặc 10.0... hoặc 172...
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://192.168.") || 
        origin.startsWith("http://10.") ||
        origin.startsWith("http://172.")
      ) {
        callback(null, true);
      } else {
        console.log("Blocked CORS origin:", origin); // Log để debug nếu cần
        callback(null, true); // Tạm thời cho phép tất cả để debug, hoặc dùng dòng dưới để chặn
        // callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Quan trọng để nhận Cookie trên điện thoại
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
const frontendDistPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendDistPath));

app.use((req, res) => {
  const indexPath = path.join(frontendDistPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend build not found. Please run 'npm run build' in frontend folder.");
  }
});
// ---------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});