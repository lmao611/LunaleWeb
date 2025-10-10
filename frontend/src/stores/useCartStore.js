// src/stores/useCartStore.js
import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

// Lấy cart từ localStorage nếu có
const getInitialCart = () => {
  try {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
  } catch (err) {
    console.error("Failed to parse cart from localStorage", err);
    return [];
  }
};

export const useCartStore = create((set, get) => ({
  cart: getInitialCart(),
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  // Đồng bộ từ backend (nếu user login)
  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });
      localStorage.setItem("cart", JSON.stringify(res.data)); // lưu vào localStorage
      get().calculateTotals();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể lấy giỏ hàng");
    }
  },

  addToCart: async (product) => {
    try {
      // Nếu user login, update backend
      await axios.post("/cart", { productId: product._id });

      const existingItem = get().cart.find((i) => i._id === product._id);
      const newCart = existingItem
        ? get().cart.map((i) =>
            i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...get().cart, { ...product, quantity: 1 }];

      set({ cart: newCart });
      localStorage.setItem("cart", JSON.stringify(newCart));
      get().calculateTotals();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể thêm vào giỏ hàng");
    }
  },

  removeFromCart: async (productId) => {
    try {
      await axios.delete("/cart", { data: { productId } }); // backend
    } catch (error) {
      console.warn("Không xóa được trên server:", error);
    }

    const newCart = get().cart.filter((i) => i._id !== productId);
    set({ cart: newCart });
    localStorage.setItem("cart", JSON.stringify(newCart));
    get().calculateTotals();
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) return get().removeFromCart(productId);

    try {
      await axios.put(`/cart/${productId}`, { quantity }); // backend
    } catch (error) {
      console.warn("Không update được trên server:", error);
    }

    const newCart = get().cart.map((i) =>
      i._id === productId ? { ...i, quantity } : i
    );
    set({ cart: newCart });
    localStorage.setItem("cart", JSON.stringify(newCart));
    get().calculateTotals();
  },

  clearCart: async () => {
    try {
      await axios.delete("/cart"); // backend
    } catch (error) {
      console.warn("Không clear được trên server:", error);
    }

    set({ cart: [], coupon: null, total: 0, subtotal: 0 });
    localStorage.removeItem("cart");
  },

  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let total = subtotal;
    if (coupon) total -= subtotal * (coupon.discountPercentage / 100);
    set({ subtotal, total });
  },
}));
