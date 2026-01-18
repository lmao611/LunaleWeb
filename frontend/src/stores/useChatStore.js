import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";
import { useUserStore } from "./useUserStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axios.get("/messages/users");
      // Chỉ lấy những user là khách hàng nếu là admin (hoặc ngược lại)
      // Ở đây lấy hết để đơn giản, có thể filter sau
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axios.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axios.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useUserStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      // Chỉ nhận tin nếu tin đó thuộc về đoạn chat đang mở
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
      
      // Âm thanh tin nhắn
      const audio = new Audio("/notification.mp3");
      audio.play().catch(()=>{});
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useUserStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));