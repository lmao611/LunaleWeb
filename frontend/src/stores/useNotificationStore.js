import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/notifications");
      // Tính toán số lượng chưa đọc từ danh sách trả về
      const unread = res.data.filter((n) => !n.isRead).length;
      set({ notifications: res.data, unreadCount: unread, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message, loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      set((state) => {
        const updatedNotifications = state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        );
        // Tính toán lại unreadCount chuẩn xác
        const unread = updatedNotifications.filter((n) => !n.isRead).length;
        return { notifications: updatedNotifications, unreadCount: unread };
      });
    } catch (error) {
      console.error(error);
    }
  },
  
  deleteNotification: async (id) => {
      try {
          await axios.delete(`/notifications/${id}`);
          set((state) => {
              const updatedNotifications = state.notifications.filter(n => n._id !== id);
              // Tính toán lại unreadCount sau khi xóa
              const unread = updatedNotifications.filter(n => !n.isRead).length;
              return { notifications: updatedNotifications, unreadCount: unread };
          });
          toast.success("Đã xóa thông báo");
      } catch (error) {
          toast.error("Lỗi khi xóa");
      }
  },

  sendNotification: async (formData) => {
    set({ loading: true });
    try {
      await axios.post("/notifications/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Gửi thông báo thành công!");
      set({ loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Gửi thất bại");
    }
  },

  // --- SỬA LOGIC Ở ĐÂY ---
  addRealtimeNotification: (newNotification) => {
      set((state) => {
          // Thêm tin mới vào đầu danh sách
          const updatedNotifications = [newNotification, ...state.notifications];
          
          // Tính toán lại unreadCount dựa trên danh sách mới
          // (Đảm bảo newNotification có isRead=false từ backend gửi về)
          const unread = updatedNotifications.filter(n => !n.isRead).length;

          return { 
              notifications: updatedNotifications,
              unreadCount: unread, 
          };
      });

      // Âm thanh và Toast
      const audio = new Audio("/notification.mp3"); 
      audio.play().catch(() => {}); 
      
      toast("🔔 Bạn có thông báo mới!", {
          duration: 4000,
          position: "top-right",
          style: {
            background: "#3b82f6",
            color: "#fff",
            fontWeight: "bold"
          },
      });
  }
}));