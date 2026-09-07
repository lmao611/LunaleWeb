import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "../lib/axios";

export const useCollectionStore = create(
  persist(
    (set, get) => ({
  collections: [],
  isLoading: false,
  editingCollection: null,

  setEditingCollection: (collection) => {
    set({ editingCollection: collection });
  },

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get("/collections");
      let data = Array.isArray(res.data) ? res.data : res.data.collections || [];

      data = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      set({ collections: data, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ collections: [], isLoading: false });
    }
  },

  fetchCollectionDetail: async (id) => {
    try {
      const res = await axios.get(`/collections/${id}`);
      const detailData = res.data;

      set((state) => {
        const exists = state.collections.find((c) => c._id === id);
        if (exists) {
          return {
            collections: state.collections.map((c) =>
              c._id === id ? detailData : c
            ),
          };
        } else {
          return { collections: [...state.collections, detailData] };
        }
      });
    } catch (error) {
      console.error(error);
    }
  },

  createCollection: async (data) => {
    try {
      const res = await axios.post("/collections", data);
      set((state) => ({
        collections: [res.data, ...state.collections]
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateCollection: async (id, data) => {
    try {
      const res = await axios.put(`/collections/${id}`, data);
      set((state) => ({
        collections: state.collections.map((c) => (c._id === id ? res.data : c)),
        editingCollection: null,
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteCollection: async (id) => {
    try {
      await axios.delete(`/collections/${id}`);
      set((state) => ({
        collections: state.collections.filter((c) => c._id !== id),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  addProductToCollection: async (id, product) => {
    try {
      const res = await axios.post(`/collections/${id}/products`, product);
      set((state) => ({
        collections: state.collections.map((c) => (c._id === id ? res.data : c)),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  removeProductFromCollection: async (id, productId) => {
    try {
      const res = await axios.delete(`/collections/${id}/products/${productId}`);
      set((state) => ({
        collections: state.collections.map((c) => (c._id === id ? res.data : c)),
      }));
    } catch (error) {
      console.error(error);
    }
  },
  }),
  {
    name: "collection-storage",
    partialize: (state) => ({ collections: state.collections }),
  }
));