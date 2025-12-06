import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api" 
        : `${import.meta.env.VITE_API_URL}/api`, 
    withCredentials: true, // Vẫn cần true để gửi cookie Refresh Token
});

// Interceptor: Tự động gắn Token vào Header
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;