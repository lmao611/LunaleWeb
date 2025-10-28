import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [tailwindcss(), react(), mkcert()],
  server: {
    https: true, // bật HTTPS
    port: 5173,
    proxy: {
  "/api": {
    target: "https://localhost:5000", // backend HTTPS
    changeOrigin: true,
    secure: false, // self-signed certificate
  },
},

  },
});
