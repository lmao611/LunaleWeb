import { create } from "zustand";
import axios from "../lib/axios";

export const useCollectionStore = create((set) => ({
  collections: [],
  isLoading: false,

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get("/collections");
      
      const data = Array.isArray(res.data) ? res.data : res.data.collections || [];
      // Lưu dữ liệu nhưng chưa tắt loading ở đây
      set({ collections: data });
    } catch (err) {
      console.error("❌ Lỗi fetch collections:", err);
      // Gặp lỗi thì set rỗng
      set({ collections: [] });
    } finally {
      // ✅ QUAN TRỌNG: Luôn tắt loading ở đây (dù thành công hay thất bại)
      set({ isLoading: false });
    }
  },
  
  createCollection: async (data) => {
    const res = await axios.post("/collections", data);
    set((state) => ({ collections: [...state.collections, res.data] }));
  },

  deleteCollection: async (id) => {
    await axios.delete(`/collections/${id}`);
    set((state) => ({
      collections: state.collections.filter((c) => c._id !== id),
    }));
  },

  addProductToCollection: async (id, product) => {
    const res = await axios.post(`/collections/${id}/products`, product);
    set((state) => ({
      collections: state.collections.map((c) => (c._id === id ? res.data : c)),
    }));
  },

  removeProductFromCollection: async (id, productId) => {
    const res = await axios.delete(`/collections/${id}/products/${productId}`);
    set((state) => ({
      collections: state.collections.map((c) => (c._id === id ? res.data : c)),
    }));
  },
}));