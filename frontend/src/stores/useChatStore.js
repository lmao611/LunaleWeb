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
  unreadUsers: new Set(),
  viewers: {},
  
  isChatOpen: false, 
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axios.get("/messages/users");
      const usersList = res.data;
      set({ users: usersList });

      const newUnreadSet = new Set();
      usersList.forEach(u => {
          if (u.hasUnread) newUnreadSet.add(u._id);
      });
      set({ unreadUsers: newUnreadSet });

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

    const tempId = Date.now().toString(); 
    const optimisticMessage = {
      _id: tempId,
      senderId: currentUser?._id || "guest",
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axios.post(`/messages/send/${selectedUser._id}`, messageData);
      
      const responseData = res.data.message ? res.data.message : res.data;

      if (res.data.accessToken) {
          localStorage.setItem("accessToken", res.data.accessToken);
          useUserStore.getState().checkAuth(); 
      }

      set((state) => ({
        messages: state.messages.map((msg) => msg._id === tempId ? responseData : msg),
      }));
    } catch (error) {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempId),
      }));
      toast.error("Gửi thất bại, vui lòng thử lại.");
    }
  },

  subscribeToUserUpdates: () => {
    const socket = useUserStore.getState().socket;
    if (!socket) return;

    socket.on("userProfileUpdated", (updatedUser) => {
        set((state) => ({
            users: state.users.map(u => u._id === updatedUser._id ? { ...u, ...updatedUser } : u),
            selectedUser: state.selectedUser?._id === updatedUser._id ? { ...state.selectedUser, ...updatedUser } : state.selectedUser
        }));
    });
  },

  unsubscribeFromUserUpdates: () => {
    const socket = useUserStore.getState().socket;
    if (socket) {
        socket.off("userProfileUpdated");
    }
  },

  subscribeToMessages: () => {
    const socket = useUserStore.getState().socket;
    const currentUser = useUserStore.getState().user;
    if (!socket || !currentUser) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();
      const isCustomer = currentUser.role === "customer";
      
      const audio = new Audio("/notification.mp3"); 
      audio.play().catch(()=>{});

      if (isCustomer) {
          if (newMessage.receiverId === currentUser._id || newMessage.senderId === currentUser._id) {
             set({ messages: [...get().messages, newMessage] });
          }
      } 
      else if (selectedUser) {
          const isRelatedToSelectedUser = 
            newMessage.senderId === selectedUser._id || 
            newMessage.receiverId === selectedUser._id;

          if (isRelatedToSelectedUser) {
            const isDuplicate = messages.some(m => m._id === newMessage._id);
            if (!isDuplicate) {
                set({ messages: [...get().messages, newMessage] });
            }
          }
      }
    });

    socket.on("viewersUpdated", (updatedViewers) => {
        set({ viewers: updatedViewers });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useUserStore.getState().socket;
    if (socket) {
        socket.off("newMessage");
        socket.off("viewersUpdated");
    }
  },

  setSelectedUser: (selectedUser) => {
    set((state) => {
        const newUnread = new Set(state.unreadUsers);
        if (selectedUser) newUnread.delete(selectedUser._id);
        return { selectedUser, unreadUsers: newUnread };
    });
  },

  markUserAsUnread: (userId) => {
      set((state) => {
          if (state.selectedUser?._id === userId) return state; 
          const newUnread = new Set(state.unreadUsers);
          newUnread.add(userId);
          return { unreadUsers: newUnread };
      });
  }
}));