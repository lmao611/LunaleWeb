import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useProductionStore = create((set) => ({
  productionData: null,
  loading: false,

  fetchProduction: async (productId) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/production/${productId}`);
      set({ productionData: res.data, loading: false });
      return res.data;
    } catch (error) {
      set({ loading: false });
      return null;
    }
  },

  saveProduction: async (productId, data, showToast = true) => {
    set({ loading: true });
    try {
      const res = await axios.post(`/production/${productId}`, data);
      set({ productionData: res.data, loading: false });
      if (showToast) {
        toast.success("Đã lưu dữ liệu sản xuất!");
      }
      return res.data;
    } catch (error) {
      set({ loading: false });
      if (showToast) {
        toast.error("Lỗi khi lưu dữ liệu!");
      }
      return null;
    }
  }
}));