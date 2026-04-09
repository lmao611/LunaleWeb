import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Mở rộng BASE_URL để tự động nhận dạng IP LAN nếu bạn test trên đt
const BASE_URL = import.meta.env.MODE === "development" 
  ? window.location.origin.replace(/:5173$/, ":5000") // Tự chuyển port 5173 thành 5000
  : "https://api.lunale.com.vn"; 

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
      
      get().disconnectSocket();

      set({ user: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi logout");
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });

      get().connectSocket();
      
    } catch (error) {
      set({ checkingAuth: false, user: null });
    }
  },

  connectSocket: () => {
    const { user, socket } = get();
    // Đảm bảo user tồn tại mới kết nối
    if (!user || (socket && socket.connected)) return;

    const newSocket = io(BASE_URL, {
      query: { userId: user._id },
      transports: ["websocket"], 
      withCredentials: true,
    });

    newSocket.on("connect", () => {
        console.log("🟢 Frontend Socket connected:", newSocket.id);
    });

    newSocket.on("userProfileUpdated", (updatedUser) => {
        if (updatedUser._id === user._id) {
            set({ user: { ...user, ...updatedUser } });
        }
    });

    newSocket.on("connect_error", (err) => {
        console.error("🔴 Frontend Socket connection error:", err.message);
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
        if (socket.connected) socket.disconnect();
        set({ socket: null });
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