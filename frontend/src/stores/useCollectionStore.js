import { create } from "zustand";
import axios from "../lib/axios";

export const useCollectionStore = create((set, get) => ({
  collections: [],
  isLoading: false,
  editingCollection: null,

  setEditingCollection: (collection) => {
    set({ editingCollection: collection });
  },

  // 1. Fetch danh sách nhẹ (cho Homepage)
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

  // ✅ 2. HÀM MỚI: Fetch chi tiết và Cache vào Store
  fetchCollectionDetail: async (id) => {
    // Không set isLoading toàn cục để tránh làm nháy giao diện chỗ khác
    try {
      const res = await axios.get(`/collections/${id}`);
      const detailData = res.data;

      set((state) => {
        // Kiểm tra xem collection này đã có trong list chưa
        const exists = state.collections.find((c) => c._id === id);

        if (exists) {
          // Nếu có rồi -> Cập nhật thêm thông tin products vào nó
          return {
            collections: state.collections.map((c) =>
              c._id === id ? detailData : c
            ),
          };
        } else {
          // Nếu chưa có (VD: User vào thẳng link detail) -> Thêm mới vào list
          return {
            collections: [...state.collections, detailData],
          };
        }
      });
    } catch (error) {
      console.error("Lỗi fetch detail:", error);
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

  updateCollection: async (id, data) => {
    try {
      const res = await axios.put(`/collections/${id}`, data);
      set((state) => ({
        collections: state.collections.map((c) => (c._id === id ? res.data : c)),
        editingCollection: null,
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