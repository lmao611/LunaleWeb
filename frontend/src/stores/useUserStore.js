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
  },

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });
    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Mật khẩu không trùng khớp");
    }
    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      
      if (res.data.accessToken) localStorage.setItem("accessToken", res.data.accessToken);
      
      set({ user: res.data.user, loading: false });
      toast.success("Đăng ký thành công");
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response?.data?.message || "Lỗi xảy ra");
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await axios.post("/auth/login", { email, password });
      
      if (res.data.accessToken) localStorage.setItem("accessToken", res.data.accessToken);

      set({ user: res.data.user, loading: false });
      toast.success("Đăng nhập thành công");
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response?.data?.message || "Lỗi xảy ra");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
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
    }
  },

  refreshToken: async () => {
    try {
      const res = await axios.post("/auth/refresh-token");
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
          originalRequest.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
          return axios(originalRequest);
        }

        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;
        
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