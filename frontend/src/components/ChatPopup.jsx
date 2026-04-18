import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useUserStore } from "../stores/useUserStore";
import { MessageCircle, X, Send, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ChatPopup = () => {
  const { isChatOpen, toggleChat, closeChat, messages, getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, setSelectedUser, users, getUsers } = useChatStore();
  
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [unreadBubble, setUnreadBubble] = useState(null); 

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [isGuestRegistered, setIsGuestRegistered] = useState(false);

  const fileInputRef = useRef(null);
  const { user, socket } = useUserStore();
  const messagesEndRef = useRef(null);
  const [adminId, setAdminId] = useState(null);

  useEffect(() => {
    const storedGuest = localStorage.getItem("chatGuestInfo");
    if (storedGuest) {
      const parsed = JSON.parse(storedGuest);
      setGuestName(parsed.name);
      setGuestPhone(parsed.phone);
      setGuestAddress(parsed.address);
      setIsGuestRegistered(true);
    }
  }, []);

  useEffect(() => {
    getUsers();
  }, [getUsers]);
  
  useEffect(() => {
      if (!user || user.role === "customer") {
          const admin = users.find(u => u.role === 'admin' || u.role === 'controller');
          if (admin) {
              setAdminId(admin._id);
              setSelectedUser(admin);
          }
      }
  }, [users, setSelectedUser, user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
        if (!isChatOpen && newMessage.senderId === adminId) {
            const previewText = newMessage.image ? "Đã gửi một ảnh 📷" : newMessage.text;
            setUnreadBubble(previewText);
        }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, isChatOpen, adminId]);

  useEffect(() => {
    if (isChatOpen && adminId && (user || isGuestRegistered)) {
      setUnreadBubble(null);
      getMessages(adminId);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [isChatOpen, adminId, getMessages, subscribeToMessages, unsubscribeFromMessages, user, isGuestRegistered]);

  useEffect(() => {
    if (messagesEndRef.current && isChatOpen) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen, imagePreview]);

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

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !guestAddress.trim()) return;
    const guestInfo = { name: guestName.trim(), phone: guestPhone.trim(), address: guestAddress.trim() };
    localStorage.setItem("chatGuestInfo", JSON.stringify(guestInfo));
    setIsGuestRegistered(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    
    const messagePayload = { text: text.trim(), image: imagePreview };
    
    if (!user && isGuestRegistered) {
        messagePayload.guestInfo = { name: guestName, phone: guestPhone, address: guestAddress };
    }

    await sendMessage(messagePayload);
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200]">
      <AnimatePresence>
        {!isChatOpen && unreadBubble && (
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={toggleChat}
                className="absolute bottom-full right-full mb-2 mr-2 bg-white px-4 py-3 rounded-2xl rounded-br-none shadow-xl border border-blue-100 max-w-[200px] cursor-pointer hover:bg-gray-50 transition"
                style={{ minWidth: '180px' }}
            >
                <button 
                    onClick={(e) => { e.stopPropagation(); setUnreadBubble(null); }}
                    className="absolute -top-2 -left-2 bg-gray-200 text-gray-500 rounded-full p-0.5 hover:bg-red-500 hover:text-white"
                >
                    <X size={12}/>
                </button>
                <p className="text-sm text-gray-800 line-clamp-2 font-medium">
                    {unreadBubble}
                </p>
                <div className="absolute bottom-0 right-0 translate-y-[5px] translate-x-[-5px] w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-white border-r-[0px] border-r-transparent"></div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 bg-white w-80 sm:w-96 max-h-[80vh] h-[500px] rounded-lg shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden"
          >
            <div className="bg-gray-950 p-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h4 className="font-bold">HỖ TRỢ KHÁCH HÀNG</h4>
              </div>
              <button onClick={closeChat} className="hover:bg-gray-800 p-1 rounded">
                <X size={18} />
              </button>
            </div>

            {!user && !isGuestRegistered ? (
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">Chào bạn!</h3>
                  <p className="text-sm text-gray-500 mt-1">Vui lòng để lại thông tin để chúng tôi hỗ trợ bạn tốt nhất.</p>
                </div>
                <form onSubmit={handleGuestSubmit} className="space-y-4">
                  <div>
                    <input type="text" required placeholder="Tên của bạn *" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-2.5 border outline-none" />
                  </div>
                  <div>
                    <input type="tel" required placeholder="Số điện thoại *" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-2.5 border outline-none" />
                  </div>
                  <div>
                    <input type="text" required placeholder="Địa chỉ *" value={guestAddress} onChange={(e) => setGuestAddress(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-2.5 border outline-none" />
                  </div>
                  <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gray-950 hover:bg-gray-800 transition-colors mt-2">
                    Bắt đầu chat
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        Xin chào! Chúng tôi có thể giúp gì cho bạn?
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = user ? msg.senderId === user._id : msg.senderId !== adminId;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                              isMine
                                ? "bg-sky-600 text-white rounded-br-none" 
                                : "bg-gray-200 text-gray-800 rounded-bl-none" 
                            } ${msg.isOptimistic ? "opacity-70" : "opacity-100"}`}
                          >
                            {msg.image && (
                              <img src={msg.image} alt="Attachment" className="sm:max-w-[200px] rounded-md mb-2 object-cover border border-white/20" />
                            )}
                            
                            {msg.text && <p className="whitespace-pre-wrap break-all">{msg.text}</p>}
                            
                            <span className={`text-[10px] block text-right mt-1 ${isMine ? "text-blue-200" : "text-gray-500"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="bg-white border-t shrink-0">
                    {imagePreview && (
                    <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
                        <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded border border-gray-300"/>
                        <button onClick={removeImage} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"><X size={12} /></button>
                        </div>
                        <span className="text-xs text-gray-500">Đang gửi ảnh...</span>
                    </div>
                    )}

                    <form onSubmit={handleSendMessage} className="p-3 flex gap-2 items-center">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition"><ImageIcon size={20} /></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange}/>

                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button type="submit" className="bg-gray-950 text-white p-2 rounded-full hover:bg-gray-800 transition disabled:opacity-50" disabled={!text.trim() && !imagePreview}>
                        <Send size={18} />
                    </button>
                    </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleChat}
        className="bg-gray-950 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center relative z-10"
      >
        {isChatOpen ? <X size={24} /> : <MessageCircle size={28} />}
        {!isChatOpen && unreadBubble && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>
    </div>
  );
};

export default ChatPopup;