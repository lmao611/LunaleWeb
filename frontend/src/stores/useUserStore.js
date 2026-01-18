import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  showUserBox: false,
  socket: null,

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
      
      // Kết nối socket ngay khi login thành công
      get().connectSocket();
      
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
      
      // Ngắt kết nối socket khi logout
      const socket = get().socket;
      if (socket) socket.disconnect();

      set({ user: null, socket: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred during logout");
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });

      // Kết nối socket khi checkAuth thành công (F5 lại trang)
      get().connectSocket();
      
    } catch (error) {
      set({ checkingAuth: false, user: null });
    }
  },

  connectSocket: () => {
    const { user, socket } = get();
    // Nếu chưa có user hoặc socket đã kết nối rồi thì không làm gì
    if (!user || (socket && socket.connected)) return;

    // Xác định URL backend (localhost:5000 khi dev, hoặc relative path khi prod)
    const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

    const newSocket = io(BASE_URL, {
      query: { userId: user._id },
    });

    newSocket.connect();
    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
    set({ socket: null });
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

    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes("/auth/login")
    ) {
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