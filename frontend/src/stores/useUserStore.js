import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  showUserBox: false, // mở form thông tin cá nhân từ mọi nơi
setShowUserBox: (value) => set({ showUserBox: value }),

  setUser: (updatedUser) => {
    set({ user: updatedUser });
    // ✅ Kích hoạt event để các component khác (Navbar, App, v.v.) update ngay
    window.dispatchEvent(new Event("user-logged-in"));
  },

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Mật khẩu không trùng khớp");
    }

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      set({ user: res.data, loading: false });
      window.dispatchEvent(new Event("user-logged-in"));
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response?.data?.message || "Lỗi xảy ra");
    }
  },

  login: async (email, password) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/login", { email, password });
      set({ user: res.data, loading: false });
      window.dispatchEvent(new Event("user-logged-in"));
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response?.data?.message || "Lỗi xảy ra");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred during logout");
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      set({ checkingAuth: false, user: null });
    }
  },

  // ✅ Bổ sung refreshToken cho interceptor
  refreshToken: async () => {
    try {
      // Đổi GET thành POST, đổi path thành /auth/refresh-token
      await axios.post("/auth/refresh-token");
    } catch (error) {
      console.error("❌ Refresh token failed:", error);
      set({ user: null });
      throw error; // Ném lỗi để interceptor bắt được
    }
  },
}));

// ========================================
// 🔁 Axios Interceptor cho token refresh
// ========================================
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Nếu đang có refresh request → đợi
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        // Tạo refresh request mới
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ========================================
// 🧠 Lắng nghe event "user-logged-in"
// để auto gọi checkAuth trên toàn app
// ========================================
window.addEventListener("user-logged-in", () => {
  useUserStore.getState().checkAuth();
});
