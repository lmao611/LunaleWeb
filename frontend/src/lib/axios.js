// src/lib/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
    // Nếu là dev (localhost) thì dùng cứng, nếu prod thì lấy từ env
    baseURL: import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api" 
        : `${import.meta.env.VITE_API_URL}/api`, 
    withCredentials: true, // Quan trọng để gửi cookie
});

export default axiosInstance;