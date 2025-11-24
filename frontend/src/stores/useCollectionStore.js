import { create } from "zustand";
import axios from "../lib/axios"; // ✅ SỬA: Import từ file cấu hình chung

export const useCollectionStore = create((set) => ({
  collections: [],
  isLoading: false,

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      // ✅ SỬA: Chỉ cần gọi đường dẫn tương đối
      const res = await axios.get("/collections");
      
      console.log("📦 collections API:", res.data);
      const data = Array.isArray(res.data) ? res.data : res.data.collections || [];
      set({ collections: data, isLoading: false });
    } catch (err) {
      console.error("❌ Lỗi fetch collections:", err);
      set({ collections: [], isLoading: false });
    }
  },

  createCollection: async (data) => {
    // ✅ SỬA: Dùng axios instance
    const res = await axios.post("/collections", data);
    set((state) => ({ collections: [...state.collections, res.data] }));
  },

  deleteCollection: async (id) => {
    // ✅ SỬA
    await axios.delete(`/collections/${id}`);
    set((state) => ({
      collections: state.collections.filter((c) => c._id !== id),
    }));
  },

  addProductToCollection: async (id, product) => {
    // ✅ SỬA
    const res = await axios.post(`/collections/${id}/products`, product);
    set((state) => ({
      collections: state.collections.map((c) => (c._id === id ? res.data : c)),
    }));
  },

  removeProductFromCollection: async (id, productId) => {
    // ✅ SỬA
    const res = await axios.delete(`/collections/${id}/products/${productId}`);
    set((state) => ({
      collections: state.collections.map((c) => (c._id === id ? res.data : c)),
    }));
  },
}));