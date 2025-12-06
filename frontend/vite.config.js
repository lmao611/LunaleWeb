import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [tailwindcss(), react(), mkcert()],
  server: {
    host: true, // 👈 BẮT BUỘC: Để mở mạng LAN cho iPhone truy cập
    https: true, // Bật HTTPS
    port: 5173,
    proxy: {
      "/api": {
        // 👇 Nếu bạn muốn test với backend Render, hãy điền link Render vào đây
        // Nếu để localhost:5000 thì máy tính chạy được nhưng iPhone sẽ lỗi (vì iPhone ko hiểu localhost là máy tính của bạn)
        target: "https://lunaleweb.onrender.com", 
        changeOrigin: true,
        secure: false,
      },
    },
  },
});