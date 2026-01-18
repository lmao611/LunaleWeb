import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useUserStore } from "../stores/useUserStore";
import { Send, User, Search, Image as ImageIcon, X } from "lucide-react";

const AdminChatManager = () => {
  const { users, getUsers, selectedUser, setSelectedUser, messages, getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { user: currentUser } = useUserStore();
  
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, imagePreview]); // Scroll khi có tin nhắn mới hoặc chọn ảnh

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
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

  const customerUsers = users.filter(u => u.role === 'customer');

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-[600px] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
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
             customerUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition ${selectedUser?._id === user._id ? "bg-blue-100" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-white flex items-center gap-3 shadow-sm z-10">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-gray-800">{selectedUser.name}</h3>
                 <p className="text-xs text-gray-500">Khách hàng</p>
               </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.senderId === currentUser._id ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex flex-col max-w-[70%]`}>
                    <div
                      className={`px-4 py-2 rounded-xl text-sm ${
                        msg.senderId === currentUser._id
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white border text-gray-800 rounded-bl-none shadow-sm"
                      }`}
                    >
                      {msg.image && (
                        <img 
                          src={msg.image} 
                          alt="Attachment" 
                          className="w-full rounded-md mb-2 object-cover border border-white/20" 
                        />
                      )}
                      {msg.text && <p>{msg.text}</p>}
                    </div>
                    <span className={`text-[10px] mt-1 ${msg.senderId === currentUser._id ? "text-right text-gray-400" : "text-left text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t">
              {/* Preview Ảnh */}
              {imagePreview && (
                <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-3">
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded border border-gray-300"/>
                    <button 
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">Đang chọn ảnh...</span>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-4 flex gap-3 items-center">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition"
                  title="Gửi ảnh"
                >
                  <ImageIcon size={22} />
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
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition disabled:opacity-50"
                  disabled={!text.trim() && !imagePreview}
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <User size={40} className="text-gray-300"/>
            </div>
            <p className="text-lg font-medium">Chọn một khách hàng để bắt đầu chat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatManager;