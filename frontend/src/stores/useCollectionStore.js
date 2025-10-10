import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL + "/api/collections";
console.log("👉 API_URL đang dùng:", API_URL);

export const useCollectionStore = create((set) => ({
  collections: [],
  isLoading: false,

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get(API_URL);
      console.log("📦 collections API:", res.data);
      // ép dữ liệu thành array
      const data = Array.isArray(res.data) ? res.data : res.data.collections || [];
      set({ collections: data, isLoading: false });
    } catch (err) {
      console.error("❌ Lỗi fetch collections:", err);
      set({ collections: [], isLoading: false });
    }
  },

  createCollection: async (data) => {
    const res = await axios.post(API_URL, data);
    set((state) => ({ collections: [...state.collections, res.data] }));
  },

  deleteCollection: async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    set((state) => ({
      collections: state.collections.filter((c) => c._id !== id),
    }));
  },

  addProductToCollection: async (id, product) => {
    const res = await axios.post(`${API_URL}/${id}/products`, product);
    set((state) => ({
      collections: state.collections.map((c) => (c._id === id ? res.data : c)),
    }));
  },

  removeProductFromCollection: async (id, productId) => {
    const res = await axios.delete(`${API_URL}/${id}/products/${productId}`);
    set((state) => ({
      collections: state.collections.map((c) => (c._id === id ? res.data : c)),
    }));
  },
}));
