import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create(
  persist(
    (set, get) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,

  setProducts: (products) => set({ products }),

  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/products", productData);
      set((state) => ({
        products: [res.data, ...state.products],
        loading: false,
      }));
      toast.success("Tạo sản phẩm thành công");
      return res.data; 
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khi tạo sản phẩm");
      set({ loading: false });
      return null;
    }
  },

  searchProducts: async (query) => {
    try {
      const response = await axios.get(`/products/search?query=${query}`);
      return response.data.products;
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(error.response?.data?.error || "Failed to fetch products");
    }
  },

  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const response = await axios.get(`/products/category/${category}`);
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(error.response?.data?.error || "Failed to fetch products by category");
    }
  },

  fetchProductById: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.get(`/products/${id}`);
      set({ selectedProduct: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Failed to fetch product");
      return null;
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete(`/products/${productId}`);
      set((state) => ({
        products: state.products.filter((p) => p._id !== productId),
        loading: false,
      }));
      toast.success("Đã xóa sản phẩm");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Failed to delete");
    }
  },

  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });
    try {
      const response = await axios.patch(`/products/${productId}`);
      set((state) => ({
        products: state.products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: response.data.isFeatured }
            : product
        ),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Failed to update featured status");
    }
  },

  togglePreOrderProduct: async (productId, newState) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/products/${productId}`, { isPreOrder: newState });
      const updated = res.data.product || res.data;

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId ? { ...p, ...updated } : p
        ),
        loading: false,
      }));
      toast.success("Đã cập nhật trạng thái");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Failed to update Pre-order");
    }
  },

  updateProduct: async (productId, updatedData) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/products/${productId}`, updatedData);
      const updated = res.data.product || res.data;

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId ? { ...p, ...updated } : p
        ),
        loading: false,
      }));

      toast.success("Cập nhật thành công");
      return updated;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Failed to update");
    }
  },

  reorderProducts: async (newOrder) => {
    set({ products: newOrder });
    try {
      await axios.put("/products/reorder", {
        orderedIds: newOrder.map((p) => p._id),
      });
    } catch (error) {
      toast.error("Failed to save order");
    }
  },

  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products/featured");
      const products = Array.isArray(response.data) ? response.data : response.data.products || [];
      set({ products, loading: false });
    } catch (error) {
      if (error.response?.status === 404) {
        set({ products: [], loading: false });
        return;
      }
      set({
        error: "Failed to fetch featured products",
        loading: false,
        products: [],
      });
      toast.error(error.response?.data?.error || "Failed to fetch featured products");
    }
  },
  }),
  {
    name: "product-storage",
    partialize: (state) => ({ products: state.products }),
  }
));