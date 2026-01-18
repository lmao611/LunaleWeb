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
  unreadUsers: new Set(), // Lưu danh sách user có tin nhắn chưa đọc (cho Admin)

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axios.get("/messages/users");
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
    const { user: currentUser } = useUserStore.getState();

    // --- 1. OPTIMISTIC UI: Hiển thị ngay lập tức ---
    const tempId = Date.now().toString(); // ID tạm
    const optimisticMessage = {
      _id: tempId,
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image, // Ảnh base64 (preview ngay)
      createdAt: new Date().toISOString(),
      isOptimistic: true, // Cờ đánh dấu tin giả
    };

    // Cập nhật state ngay lập tức
    set({ messages: [...messages, optimisticMessage] });

    try {
      // Gửi thật lên server
      const res = await axios.post(`/messages/send/${selectedUser._id}`, messageData);
      
      // Khi server trả về, thay thế tin nhắn tạm bằng tin thật (để có ID thật)
      set((state) => ({
        messages: state.messages.map((msg) => 
          msg._id === tempId ? res.data : msg
        ),
      }));
    } catch (error) {
      // Nếu lỗi thì xóa tin tạm và báo lỗi
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempId),
      }));
      toast.error("Gửi thất bại, vui lòng thử lại.");
    }
  },

  subscribeToMessages: () => {
    const socket = useUserStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();
      
      // --- XỬ LÝ ÂM THANH (TING) ---
      const audio = new Audio("/notification.mp3"); 
      audio.play().catch(()=>{});

      // Trường hợp 1: Đang mở đoạn chat với người gửi -> Thêm vào list
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({ messages: [...messages, newMessage] });
      } 
      
      // Trường hợp 2: Admin đang chat người khác hoặc ở dashboard -> Đánh dấu chưa đọc
      // Logic này sẽ được bổ sung xử lý ở Component Admin để hiện Toast
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useUserStore.getState().socket;
    if (socket) socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => {
    // Khi chọn user, xóa user đó khỏi danh sách chưa đọc
    set((state) => {
        const newUnread = new Set(state.unreadUsers);
        newUnread.delete(selectedUser?._id);
        return { selectedUser, unreadUsers: newUnread };
    });
  },

  // Hàm helper để thêm user vào danh sách chưa đọc
  markUserAsUnread: (userId) => {
      set((state) => {
          if (state.selectedUser?._id === userId) return state; // Đang xem thì không tính là chưa đọc
          const newUnread = new Set(state.unreadUsers);
          newUnread.add(userId);
          return { unreadUsers: newUnread };
      });
  }
}));