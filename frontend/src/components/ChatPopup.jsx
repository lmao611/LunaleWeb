import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useUserStore } from "../stores/useUserStore";
import { MessageCircle, X, Send, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ChatPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  
  const [unreadBubble, setUnreadBubble] = useState(null); 

  const fileInputRef = useRef(null);
  const { user, socket } = useUserStore();
  const { messages, getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, setSelectedUser, users, getUsers } = useChatStore();
  const messagesEndRef = useRef(null);
  const [adminId, setAdminId] = useState(null);

  useEffect(() => {
    if (user) getUsers();
  }, [user, getUsers]);
  
  useEffect(() => {
      const admin = users.find(u => u.role === 'admin' || u.role === 'controller');
      if (admin) {
          setAdminId(admin._id);
          setSelectedUser(admin);
      }
  }, [users, setSelectedUser]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
        if (!isOpen && newMessage.senderId === adminId) {
            const previewText = newMessage.image ? "Đã gửi một ảnh 📷" : newMessage.text;
            setUnreadBubble(previewText);
            const audio = new Audio("/notification.mp3");
            audio.play().catch(()=>{});
        }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, isOpen, adminId]);

  useEffect(() => {
    if (isOpen && adminId) {
      setUnreadBubble(null);
      getMessages(adminId);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [isOpen, adminId, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, imagePreview]);

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

  if (!user || user.role === "admin" || user.role === "controller") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end">
      
      <AnimatePresence>
        {!isOpen && unreadBubble && (
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setIsOpen(true)}
                className="mb-2 bg-white px-4 py-3 rounded-2xl rounded-br-none shadow-xl border border-blue-100 max-w-[200px] cursor-pointer relative hover:bg-gray-50 transition"
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
                <div className="absolute bottom-0 right-[-6px] w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white border-r-[0px] border-r-transparent"></div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white w-80 sm:w-96 max-h-[80vh] h-[500px] rounded-lg shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden"
          >
            <div className="bg-gray-950 p-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h4 className="font-bold">HỖ TRỢ KHÁCH HÀNG</h4>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-gray-800 p-1 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                 <div className="text-center text-gray-400 text-sm mt-10">
                    Xin chào! Chúng tôi có thể giúp gì cho bạn?
                 </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.senderId === user._id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                        msg.senderId === user._id
                          ? "bg-sky-600 text-white rounded-br-none" 
                          : "bg-gray-200 text-gray-800 rounded-bl-none" 
                      } ${msg.isOptimistic ? "opacity-70" : "opacity-100"}`}
                    >
                      {msg.image && (
                        <img src={msg.image} alt="Attachment" className="sm:max-w-[200px] rounded-md mb-2 object-cover border border-white/20" />
                      )}
                      
                      {/* --- SỬA Ở ĐÂY: Thêm break-words --- */}
                      {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                      
                      <span className={`text-[10px] block text-right mt-1 ${msg.senderId === user._id ? "text-blue-200" : "text-gray-500"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))
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
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-950 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center relative"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
        {!isOpen && unreadBubble && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>
    </div>
  );
};

export default ChatPopup;