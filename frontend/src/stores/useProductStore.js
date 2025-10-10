import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set) => ({
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
        products: [...state.products, res.data],
        loading: false,
      }));
      toast.success("Đã tạo sản phẩm thành công!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Không thể tạo sản phẩm");
      set({ loading: false });
    }
  },

  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(error.response?.data?.error || "Không thể tải sản phẩm");
    }
  },

  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const response = await axios.get(`/products/category/${category}`);
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      toast.error(error.response?.data?.error || "Không thể tải sản phẩm theo loại");
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
      toast.error(error.response?.data?.error || "Không thể tải sản phẩm");
      return null;
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete(`/products/${productId}`);
      set((state) => ({
        products: state.products.filter((product) => product._id !== productId),
        loading: false,
      }));
      toast.success("Đã xóa sản phẩm");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Không thể xóa sản phẩm");
    }
  },

  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });
    try {
      const response = await axios.patch(`/products/${productId}`);
      set((state) => ({
        products: state.products.map((product) =>
          product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
        ),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.error || "Không thể cập nhật trạng thái nổi bật");
    }
  },

  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products/featured");
      const products = Array.isArray(response.data) ? response.data : response.data.products || [];
      set({ products, loading: false });
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        set({ products: [], loading: false });
        return;
      }
      set({ error: "Failed to fetch featured products", loading: false, products: [] });
      toast.error(error.response?.data?.error || "Không thể tải sản phẩm nổi bật");
    }
  },
}));
