import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  showUserBox: false,

  setShowUserBox: (value) => set({ showUserBox: value }),

  setUser: (updatedUser) => {
    set({ user: updatedUser });
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
      
      // LƯU TOKEN
      if (res.data.accessToken) localStorage.setItem("accessToken", res.data.accessToken);
      
      set({ user: res.data.user, loading: false });
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
      
      // LƯU TOKEN
      if (res.data.accessToken) localStorage.setItem("accessToken", res.data.accessToken);

      set({ user: res.data.user, loading: false });
      window.dispatchEvent(new Event("user-logged-in"));
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response?.data?.message || "Lỗi xảy ra");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      // XÓA TOKEN
      localStorage.removeItem("accessToken");
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
      // Nếu checkAuth lỗi (token hết hạn), thử xóa để sạch sẽ
      // localStorage.removeItem("accessToken"); 
    }
  },

  refreshToken: async () => {
    try {
      const res = await axios.post("/auth/refresh-token");
      // CẬP NHẬT TOKEN MỚI
      if (res.data.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }
      return res.data;
    } catch (error) {
      set({ user: null });
      localStorage.removeItem("accessToken");
      throw error;
    }
  },
}));

// --- Axios Interceptor cho Refresh Token ---
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (refreshPromise) {
          await refreshPromise;
          // Sau khi refresh xong, cập nhật header cho request đang đợi
          originalRequest.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
          return axios(originalRequest);
        }

        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;
        
        // Cập nhật header cho request đang bị lỗi
        originalRequest.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
        return axios(originalRequest);
      } catch (refreshError) {
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

window.addEventListener("user-logged-in", () => {
  useUserStore.getState().checkAuth();
});