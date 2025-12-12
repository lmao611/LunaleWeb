import { create } from "zustand";
import axios from "../lib/axios";

export const useCollectionStore = create((set, get) => ({
  collections: [],
  isLoading: false,
  
  // ✅ STATE MỚI: Lưu collection đang được sửa
  editingCollection: null,

  setEditingCollection: (collection) => {
    set({ editingCollection: collection });
  },

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get("/collections");
      const data = Array.isArray(res.data) ? res.data : res.data.collections || [];
      set({ collections: data, isLoading: false });
    } catch (err) {
      console.error("❌ Lỗi fetch collections:", err);
      set({ collections: [], isLoading: false });
    }
  },

  createCollection: async (data) => {
    try {
      const res = await axios.post("/collections", data);
      set((state) => ({ collections: [...state.collections, res.data] }));
    } catch (error) {
      console.error("Lỗi tạo collection:", error);
      throw error;
    }
  },

  // ✅ HÀM MỚI: Update Collection
  updateCollection: async (id, data) => {
    try {
      const res = await axios.put(`/collections/${id}`, data);
      set((state) => ({
        collections: state.collections.map((c) => (c._id === id ? res.data : c)),
        editingCollection: null, // Tắt chế độ edit sau khi xong
      }));
    } catch (error) {
      console.error("Lỗi cập nhật collection:", error);
      throw error;
    }
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