import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useUserStore } from "../stores/useUserStore";
import { MessageCircle, X, Send, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ChatPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // State lưu ảnh xem trước
  const fileInputRef = useRef(null); // Ref để kích hoạt input file

  const { user } = useUserStore();
  const { messages, getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, setSelectedUser, users, getUsers } = useChatStore();
  const messagesEndRef = useRef(null);
  const [adminId, setAdminId] = useState(null);

  useEffect(() => {
    if (user && isOpen) {
      getUsers();
    }
  }, [user, isOpen, getUsers]);
  
  useEffect(() => {
      const admin = users.find(u => u.role === 'admin' || u.role === 'controller');
      if (admin) {
          setAdminId(admin._id);
          setSelectedUser(admin);
      }
  }, [users, setSelectedUser]);

  useEffect(() => {
    if (isOpen && adminId) {
      getMessages(adminId);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [isOpen, adminId, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Xử lý chọn ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Xóa ảnh đã chọn
  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return; // Không gửi nếu rỗng cả 2

    await sendMessage({ text: text.trim(), image: imagePreview });

    // Reset form
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!user || user.role === "admin" || user.role === "controller") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white w-80 sm:w-96 h-[500px] rounded-lg shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden"
          >
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="font-bold">Hỗ trợ trực tuyến</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                 <div className="text-center text-gray-400 text-sm mt-10">
                    👋 Xin chào! Chúng tôi có thể giúp gì cho bạn?
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
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      {msg.image && (
                        <img 
                          src={msg.image} 
                          alt="Attachment" 
                          className="sm:max-w-[200px] rounded-md mb-2 object-cover border border-white/20" 
                        />
                      )}
                      {msg.text && <p>{msg.text}</p>}
                      <span className={`text-[10px] block text-right mt-1 ${msg.senderId === user._id ? "text-blue-200" : "text-gray-500"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview Ảnh trước khi gửi */}
            {imagePreview && (
              <div className="px-4 py-2 bg-gray-50 border-t flex items-center gap-2">
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded border border-gray-300"/>
                  <button 
                    onClick={removeImage}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
                <span className="text-xs text-gray-500">Đang chọn 1 ảnh</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 items-center">
              {/* Nút chọn ảnh */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition"
              >
                <ImageIcon size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />

              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit" 
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50"
                disabled={!text.trim() && !imagePreview}
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

export default ChatPopup;