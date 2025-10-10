import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import { connectDB } from "./lib/db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/collections", collectionRoutes);

if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*",(req,res) => {
    res.sendFile(path.resolve(__dirname, "frontend","dist","index.html"))
  })
}

app.listen(PORT, () => {
  console.log("🚀 Server is running on http://localhost:" + PORT);
  connectDB();
});
