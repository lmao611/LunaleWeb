import { useState, useEffect } from "react";
import { useNotificationStore } from "../stores/useNotificationStore";
import axios from "../lib/axios"; // Để lấy list users
import { Send, Upload, User, Users } from "lucide-react";
import { motion } from "framer-motion";

const SendNotificationForm = () => {
  const { sendNotification, loading } = useNotificationStore();
  
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  
  const [users, setUsers] = useState([]);

  // Lấy danh sách user để chọn
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/auth/users"); // Cần đảm bảo endpoint này tồn tại (đã có trong file auth.controller.js của bạn: getAllUsers)
        // Lọc chỉ lấy khách hàng
        const customers = res.data.filter(u => u.role === "customer");
        setUsers(customers);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    if (!sendToAll) fetchUsers();
  }, [sendToAll]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("message", message);
    formData.append("sendToAll", sendToAll);
    if (!sendToAll) formData.append("userId", selectedUser);
    if (image) formData.append("image", image);

    await sendNotification(formData);
    
    // Reset form
    setMessage("");
    setImage(null);
    setSelectedUser("");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white shadow-lg rounded-lg p-8 max-w-2xl mx-auto border border-gray-200"
    >
      <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
        <Send className="w-6 h-6" /> Gửi Thông Báo
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tùy chọn gửi */}
        <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
           <label className="flex items-center space-x-2 cursor-pointer">
             <input 
               type="checkbox" 
               checked={sendToAll} 
               onChange={(e) => setSendToAll(e.target.checked)}
               className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
             />
             <span className="font-medium text-gray-700 flex items-center gap-1"><Users size={18}/> Gửi toàn bộ khách hàng</span>
           </label>
        </div>

        {/* Chọn khách hàng (nếu không gửi tất cả) */}
        {!sendToAll && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <User size={16}/> Chọn Khách Hàng
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              required={!sendToAll}
            >
              <option value="">-- Chọn người nhận --</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nội dung tin nhắn */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung thông báo</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Nhập nội dung thông báo..."
            required
          />
        </div>

        {/* Upload Ảnh */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm (Tùy chọn)</label>
            <div className="flex items-center gap-3">
                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md shadow-sm flex items-center transition">
                    <Upload className="w-5 h-5 mr-2" />
                    {image ? "Đã chọn ảnh" : "Tải ảnh lên"}
                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
                {image && <span className="text-sm text-gray-500">{image.name}</span>}
            </div>
        </div>

        {/* Nút gửi */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-400"
        >
          {loading ? (
            <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                Đang gửi...
            </>
          ) : (
            <>
                <Send className="w-5 h-5 mr-2" /> Gửi Ngay
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default SendNotificationForm;