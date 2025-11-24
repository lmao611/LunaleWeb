import { create } from "zustand";
import axios from "../lib/axios"; // ✅ SỬA: Import instance đã cấu hình

export const useCollectionStore = create((set) => ({
  collections: [],
  isLoading: false,

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      // ✅ SỬA: Bỏ API_URL nối chuỗi, chỉ gọi path tương đối
      const res = await axios.get("/collections");
      
      const data = Array.isArray(res.data) ? res.data : res.data.collections || [];
      set({ collections: data, isLoading: false });
    } catch (err) {
      console.error("❌ Lỗi fetch collections:", err);
      set({ collections: [], isLoading: false });
    }
  },
  
  // Áp dụng tương tự cho các hàm create, delete bên dưới:
  createCollection: async (data) => {
    const res = await axios.post("/collections", data); // ✅ Sửa
    set((state) => ({ collections: [...state.collections, res.data] }));
  },

  deleteCollection: async (id) => {
    await axios.delete(`/collections/${id}`); // ✅ Sửa
    set((state) => ({
      collections: state.collections.filter((c) => c._id !== id),
    }));
  },

  addProductToCollection: async (id, product) => {
    const res = await axios.post(`/collections/${id}/products`, product); // ✅ Sửa
    set((state) => ({
      collections: state.collections.map((c) => (c._id === id ? res.data : c)),
    }));
  },

  removeProductFromCollection: async (id, productId) => {
    const res = await axios.delete(`/collections/${id}/products/${productId}`); // ✅ Sửa
    set((state) => ({
      collections: state.collections.map((c) => (c._id === id ? res.data : c)),
    }));
  },
}));