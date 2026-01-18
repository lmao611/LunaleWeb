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
          set((state) => ({
              notifications: state.notifications.filter(n => n._id !== id),
              unreadCount: state.notifications.filter(n => n._id !== id && !n.isRead).length
          }));
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

  addRealtimeNotification: (newNotification) => {
      set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
      }));
      toast("Bạn có thông báo mới!", { icon: "🔔" });
  }
}));