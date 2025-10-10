import { create } from "zustand";
import axios from "../lib/axios";
import toast  from 'react-hot-toast'

export const useUserStore = create((set,get) => ({
    user:null,
    loading:false,
    checkingAuth: true,

    signup: async({name,email,password,confirmPassword}) => {
        set({loading: true});

        if(password !== confirmPassword){
            set({loading: false});
            return toast.error("Mật khẩu không trùng khớp")
        }

        try {
            const res = await axios.post("/auth/signup", {name,email,password});
            set({user: res.data, loading:false})
        } catch (error) {
            set({loading:false});
            return toast.error(error.response.data.message || "Lỗi xảy ra")
        }
    },
    login: async (email, password) => {
        set({ loading: true });

        try {
            const res = await axios.post("/auth/login", { email, password });
            set({ user: res.data, loading: false });
        } catch (error) {
            set({ loading: false });
            return toast.error(error.response?.data?.message || "Lỗi xảy ra");
        }
    },
    logout: async () => {
        try {
            await axios.post("/auth/logout");
            set({user: null})
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred during logout")
        }
    },
    checkAuth: async () =>{
        set ({checkingAuth: true})
        try {
            const response = await axios.get("/auth/profile");
            set({user: response.data, checkingAuth: false});
        } catch (error) {
            set({checkingAuth: false, user: null})
        }
    }


}))
// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Nếu đang có refresh request thì đợi nó xong
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
        // Nếu refresh thất bại thì logout
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);







