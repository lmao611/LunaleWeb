import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { uploadBannerMedia } from "../lib/uploadImage";

export const useBannerStore = create(
  persist(
    (set) => ({
      bannerUrl: "",
      bannerType: "image",
      posterUrl: "",
      loading: false,
      isBannerLoaded: false,

      setIsBannerLoaded: (status) => set({ isBannerLoaded: status }),

      fetchBanner: async () => {
        try {
          const res = await axios.get("/banner");
          const { mediaUrl, mediaType, posterUrl, imageUrl } = res.data || {};

          set({
            bannerUrl: mediaUrl || imageUrl || "",
            bannerType: mediaType === "video" ? "video" : "image",
            posterUrl: posterUrl || "",
          });
        } catch (err) {
          // 404 = chưa có banner, không phải lỗi
          if (err?.response?.status !== 404) {
            toast.error("Không thể tải banner");
          }
        }
      },

      /**
       * Upload ảnh hoặc video rồi lưu URL vào DB.
       * File đi THẲNG lên Cloudinary, server chỉ nhận URL.
       */
      uploadBanner: async (file) => {
        set({ loading: true });
        try {
          const { mediaUrl, mediaType, posterUrl } = await uploadBannerMedia(file);

          const res = await axios.post("/banner", { mediaUrl, mediaType, posterUrl });

          set({
            bannerUrl: res.data?.mediaUrl || mediaUrl,
            bannerType: mediaType,
            posterUrl: res.data?.posterUrl || posterUrl,
            isBannerLoaded: false,
            loading: false,
          });

          toast.success("Cập nhật banner thành công!");
          return true;
        } catch (err) {
          toast.error(
            err?.response?.data?.message || err?.message || "Tải banner thất bại"
          );
          set({ loading: false });
          return false;
        }
      },
    }),
    {
      name: "banner-storage",
      // Cache để hero hiện ngay khi quay lại trang, không chờ API
      partialize: (state) => ({
        bannerUrl: state.bannerUrl,
        bannerType: state.bannerType,
        posterUrl: state.posterUrl,
      }),
    }
  )
);
