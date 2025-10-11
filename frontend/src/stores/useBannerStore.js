import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useBannerStore = create((set) => ({
  bannerUrl: "",
  loading: false,

  fetchBanner: async () => {
    try {
      const res = await axios.get("/banner");
      set({ bannerUrl: res.data.imageUrl || "" });
    } catch {
      toast.error("Không thể tải ảnh banner");
    }
  },

  uploadBanner: async (file) => {
    set({ loading: true });
    try {
      // 🖼️ Upload lên Cloudinary
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );
      const cloudData = await cloudRes.json();

      const imageUrl = cloudData.secure_url;

      // 📡 Gửi URL lên server
      const res = await axios.post("/banner", { imageUrl });

      set({ bannerUrl: res.data.imageUrl, loading: false });
      toast.success("Cập nhật banner thành công!");
    } catch (err) {
      console.log(err);
      toast.error("Tải ảnh thất bại");
      set({ loading: false });
    }
  },
}));
    