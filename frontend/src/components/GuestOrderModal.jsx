import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export default function GuestOrderModal({ isOpen, onClose, product }) {
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    size: "M",
    quantity: 1
  });
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/customer-orders/guest", {
        ...formData,
        productId: product._id
      });
      toast.success("Đặt hàng thành công! Cửa hàng sẽ sớm liên hệ với bạn.");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi đặt hàng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <ShoppingBag size={22} className="text-blue-600" /> Đặt Hàng Nhanh
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="flex gap-4 items-center mb-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <img src={product.image || product.thumbnail} alt={product.name} className="w-16 h-16 object-cover rounded-md border border-gray-200 bg-white" />
                <div>
                  <p className="font-semibold text-gray-800 line-clamp-1">{product.name}</p>
                  <p className="text-blue-600 font-bold">{new Intl.NumberFormat('vi-VN').format(product.price)} ₫</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên</label>
                <input required type="text" name="customerName" placeholder="Nhập họ tên của bạn..." value={formData.customerName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
                <input required type="tel" name="phone" placeholder="Nhập số điện thoại..." value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ giao hàng</label>
                <input required type="text" name="address" placeholder="Nhập địa chỉ giao hàng..." value={formData.address} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Size</label>
                  <select name="size" value={formData.size} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white font-medium">
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số lượng</label>
                  <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white font-medium" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-70 mt-6 shadow-md shadow-blue-200">
                {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}