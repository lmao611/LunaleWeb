import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

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

  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });
      localStorage.setItem("cart", JSON.stringify(res.data)); 
      get().calculateTotals();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể lấy giỏ hàng");
    }
  },

  // 👇 CẬP NHẬT: Nhận thêm size và quantity
  addToCart: async (product, size = "M", quantity = 1) => {
    try {
      await axios.post("/cart", { 
          productId: product._id, 
          size: size, 
          quantity: quantity 
      });

      // Update state local
      const currentCart = get().cart;
      // Tìm xem đã có sản phẩm đó + size đó chưa
      const existingItemIndex = currentCart.findIndex(
          (i) => i._id === product._id && i.size === size
      );

      let newCart;
      if (existingItemIndex > -1) {
          // Nếu có rồi thì tăng số lượng
          newCart = [...currentCart];
          newCart[existingItemIndex].quantity += quantity;
      } else {
          // Chưa có thì thêm mới
          newCart = [...currentCart, { ...product, quantity, size }];
      }

      set({ cart: newCart });
      localStorage.setItem("cart", JSON.stringify(newCart));
      get().calculateTotals();
      
      return { success: true };
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể thêm vào giỏ hàng");
      return { success: false };
    }
  },

  removeFromCart: async (productId) => {
    try {
      await axios.delete("/cart", { data: { productId } }); 
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
      await axios.put(`/cart/${productId}`, { quantity }); 
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
      await axios.delete("/cart"); 
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

  placeOrder: async (orderData) => {
    try {
      const res = await axios.post("/customer-orders", orderData);
      if (orderData.isFromCart) {
        set({ cart: [], total: 0, subtotal: 0 });
        localStorage.removeItem("cart");
      }
      return { success: true, data: res.data };
    } catch (error) {
      toast.error(error.response?.data?.message || "Đặt hàng thất bại");
      return { success: false, error };
    }
  },
}));