import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useUserStore } from "../stores/useUserStore";
import { Send, User, Search, Image as ImageIcon, X, ArrowLeft, Eye } from "lucide-react";
import toast from "react-hot-toast";

const AdminChatManager = () => {
  const { users, getUsers, selectedUser, setSelectedUser, messages, getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, unreadUsers, markUserAsUnread, viewers } = useChatStore();
  const { user: currentUser, socket } = useUserStore();
  
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Ref cho khung chat để scroll
  const chatContainerRef = useRef(null);
  // Ref để theo dõi người dùng cũ (để gửi sự kiện leave chat)
  const prevSelectedUserRef = useRef(null);

  // --- HÀM NÉN ẢNH ---
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 800; 
            const scaleSize = MAX_WIDTH / img.width;
            
            if (scaleSize < 1) {
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL("image/jpeg", 0.7));
        };
    };
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, (compressedResult) => {
        setImagePreview(compressedResult);
    });
  };

  // --- LẮNG NGHE TOÀN CỤC (Để hiện Toast khi đang ở Dashboard) ---
  useEffect(() => {
      if(!socket) return;

      const handleGlobalMessage = (newMessage) => {
          if (newMessage.senderId !== currentUser._id) {
              // Xác định ai là khách hàng trong tin nhắn này
              const partnerId = (newMessage.senderId === currentUser._id || users.some(u => u._id === newMessage.senderId)) 
                                ? newMessage.senderId 
                                : newMessage.receiverId;

              const isPartnerCustomer = users.some(u => u._id === partnerId && u.role === 'customer');

              // Nếu tin nhắn KHÔNG thuộc về cuộc hội thoại đang mở
              if (partnerId !== selectedUser?._id && isPartnerCustomer) {
                  markUserAsUnread(partnerId);
                  
                  const sender = users.find(u => u._id === partnerId);
                  const senderName = sender ? sender.name : "Khách hàng";

                  toast.custom((t) => (
                    <div
                      className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                      onClick={() => {
                          if (sender) setSelectedUser(sender);
                          toast.dismiss(t.id);
                      }}
                    >
                      <div className="flex-1 w-0 p-4 cursor-pointer">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {senderName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Tin nhắn mới liên quan {senderName}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                              {newMessage.image ? "Đã gửi một ảnh" : newMessage.text}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-l border-gray-200">
                        <button
                          onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
                          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  ), { duration: 4000, position: "top-right" });
                  
                  const audio = new Audio("/notification.mp3");
                  audio.play().catch(()=>{});
              }
          }
      };

      socket.on("newMessage", handleGlobalMessage);
      return () => socket.off("newMessage", handleGlobalMessage);
  }, [socket, selectedUser, users, markUserAsUnread, currentUser]);

  // --- INIT DATA & RESET STATE ---
  useEffect(() => {
    getUsers();
    
    // Quan trọng: Reset selectedUser về null khi component mount để luôn hiện danh sách trước
    setSelectedUser(null);

    // Cleanup khi thoát component
    return () => {
        setSelectedUser(null);
    };
  }, [getUsers, setSelectedUser]);

  // --- LOGIC VÀO/RA PHÒNG CHAT & LẤY TIN NHẮN ---
  useEffect(() => {
    // 1. Nếu có người cũ -> Gửi Leave Chat
    if (prevSelectedUserRef.current && prevSelectedUserRef.current._id !== selectedUser?._id) {
        if(socket) socket.emit("admin_leave_chat", { customerId: prevSelectedUserRef.current._id, adminId: currentUser._id });
    }

    // 2. Nếu có người mới -> Gửi Enter Chat
    if (selectedUser) {
        if(socket) socket.emit("admin_enter_chat", { customerId: selectedUser._id, adminId: currentUser._id, adminName: currentUser.name });
        
        getMessages(selectedUser._id);
        subscribeToMessages();
    }

    // Cập nhật ref
    prevSelectedUserRef.current = selectedUser;

    return () => {
        // Cleanup khi unmount hoặc đổi user
        unsubscribeFromMessages();
        if (selectedUser && socket) {
             socket.emit("admin_leave_chat", { customerId: selectedUser._id, adminId: currentUser._id });
        }
    };
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages, socket, currentUser]);

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, imagePreview]);

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    await sendMessage({ text: text.trim(), image: imagePreview });
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const customerUsers = users.filter(u => u.role === 'customer');

  // Helper lấy text người xem
  const getViewerText = (customerId) => {
      if (!viewers[customerId]) return null;
      const otherViewers = viewers[customerId].filter(v => v.adminId !== currentUser._id);
      if (otherViewers.length === 0) return null;

      if (otherViewers.length === 1) {
          return `${otherViewers[0].adminName} hiện đang theo dõi đoạn chat này`;
      } else {
          return `${otherViewers.length} admin đang theo dõi đoạn chat này`;
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-[80vh] md:h-[600px] flex overflow-hidden">
      
      {/* SIDEBAR DANH SÁCH */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 flex-col ${selectedUser ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b bg-gray-50">
           <h3 className="font-bold text-gray-700 mb-2">Đoạn chat</h3>
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
             <input type="text" placeholder="Tìm kiếm..." className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"/>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {customerUsers.length === 0 ? (
             <p className="text-center text-gray-500 p-4 text-sm">Chưa có tin nhắn nào</p>
          ) : (
             customerUsers.map((user) => {
                const viewerText = getViewerText(user._id);

                return (
                    <div
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition relative ${selectedUser?._id === user._id ? "bg-blue-100" : ""}`}
                    >
                    <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            <User size={20} />
                        </div>
                        {unreadUsers.has(user._id) && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                            <p className={`text-sm truncate ${unreadUsers.has(user._id) ? "font-bold text-black" : "font-medium text-gray-800"}`}>
                                {user.name}
                            </p>
                            
                            {/* --- HIỂN THỊ DÒNG CHỮ ĐỎ (TRACKING) --- */}
                            {viewerText && (
                                <div className="flex items-center gap-1 text-[10px] text-red-500 font-medium animate-pulse ml-2 shrink-0">
                                    <Eye size={12} />
                                    <span className="hidden sm:inline">{viewerText}</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Nếu có người xem thì hiện text ở dòng dưới cho mobile dễ nhìn */}
                        {viewerText ? (
                            <p className="text-[10px] text-red-500 truncate sm:hidden mt-0.5">
                                {viewerText}
                            </p>
                        ) : (
                            <p className={`text-xs truncate ${unreadUsers.has(user._id) ? "font-bold text-gray-800" : "text-gray-500"}`}>
                                {user.email}
                            </p>
                        )}
                    </div>
                    </div>
                );
             })
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className={`flex-1 flex-col relative ${!selectedUser ? "hidden md:flex" : "flex"}`}>
        {selectedUser ? (
          <>
            <div className="p-3 border-b bg-white flex items-center gap-3 shadow-sm z-10">
               {/* Nút Back trên Mobile */}
               <button 
                 onClick={() => setSelectedUser(null)}
                 className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
               >
                 <ArrowLeft size={20} />
               </button>

               <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <User size={18} />
               </div>
               <div>
                 <h3 className="font-bold text-gray-800 text-sm md:text-base">{selectedUser.name}</h3>
                 <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Khách hàng</p>
                    {/* Hiển thị tracking ở Header Chat */}
                    {getViewerText(selectedUser._id) && (
                        <span className="text-[10px] text-red-500 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                            <Eye size={10} /> {getViewerText(selectedUser._id)}
                        </span>
                    )}
                 </div>
               </div>
            </div>

            {/* --- KHUNG CHAT (Có ref để scroll) --- */}
            <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth"
            >
              {messages.map((msg) => {
                // LOGIC: Người gửi KHÁC khách hàng -> Là Admin -> Nằm phải
                const isAdminSide = msg.senderId !== selectedUser._id;

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isAdminSide ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex flex-col max-w-[75%]`}>
                      <div
                        className={`px-4 py-2 rounded-xl text-sm ${
                          isAdminSide
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white border text-gray-800 rounded-bl-none shadow-sm"
                        } ${msg.isOptimistic ? "opacity-70" : ""}`}
                      >
                        {msg.image && (
                          <img src={msg.image} alt="Attachment" className="w-full rounded-md mb-2 object-cover border border-white/20" />
                        )}
                        {/* --- TEXT WRAPPING --- */}
                        {msg.text && <p className="whitespace-pre-wrap break-all">{msg.text}</p>}
                      </div>
                      <span className={`text-[10px] mt-1 ${isAdminSide ? "text-right text-gray-400" : "text-left text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleString([], {hour: '2-digit', minute:'2-digit', day:'numeric', month:'numeric'})}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white border-t">
              {imagePreview && (
                <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-3">
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded border border-gray-300"/>
                    <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"><X size={14} /></button>
                  </div>
                  <span className="text-sm text-gray-500">Đang chọn ảnh...</span>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-3 md:p-4 flex gap-2 md:gap-3 items-center">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition"><ImageIcon size={22} /></button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange}/>

                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 md:p-2.5 rounded-lg transition disabled:opacity-50" disabled={!text.trim() && !imagePreview}>
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          // --- MÀN HÌNH CHỜ (Khi chưa chọn khách) ---
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-gray-300 md:w-10 md:h-10"/>
            </div>
            <p className="text-base md:text-lg font-medium">Chọn một khách hàng để bắt đầu chat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatManager;