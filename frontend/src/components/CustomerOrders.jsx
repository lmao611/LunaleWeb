import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { CheckCircle, Trash2, Clock, MapPin, Phone, User, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fetch orders từ server
  const fetchOrders = async () => {
    try {
      const res = await axios.get("/customer-orders");
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      toast.error("Lỗi tải danh sách đơn hàng");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Hàm xử lý: Đổi trạng thái Pending <-> Processed
  const handleToggleStatus = async (orderId, currentStatus) => {
    const newStatus = currentStatus === "Pending" ? "Processed" : "Pending";
    try {
      await axios.patch(`/customer-orders/${orderId}`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      toast.success(newStatus === "Processed" ? "Đã xác nhận đơn hàng" : "Đã hoàn tác");
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // Hàm xóa đơn hàng
  const handleDelete = async (orderId) => {
    if (!confirm("Bạn chắc chắn muốn xóa vĩnh viễn đơn hàng này?")) return;
    try {
      await axios.delete(`/customer-orders/${orderId}`);
      setOrders(orders.filter(o => o._id !== orderId));
      toast.success("Đã xóa đơn hàng");
    } catch (error) {
      toast.error("Lỗi xóa đơn hàng");
    }
  };

  // --- LOGIC NHÓM ĐƠN HÀNG THEO NGÀY ---
  const groupedOrders = orders.reduce((groups, order) => {
    // Chuyển đổi createdAt thành chuỗi ngày dd/mm/yyyy
    const dateObj = new Date(order.createdAt);
    const dateStr = dateObj.toLocaleDateString("vi-VN"); // ví dụ: 20/10/2024
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(order);
    return groups;
  }, {});

  // Lấy danh sách các ngày có đơn và sắp xếp (Mới nhất -> Cũ nhất)
  const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
    // Cần parse lại từ chuỗi dd/mm/yyyy sang Date object để so sánh đúng
    const [d1, m1, y1] = a.split("/");
    const [d2, m2, y2] = b.split("/");
    return new Date(`${y2}-${m2}-${d2}`) - new Date(`${y1}-${m1}-${d1}`);
  });

  // Tự động chọn ngày mới nhất khi load xong
  useEffect(() => {
    if (sortedDates.length > 0 && !selectedDate) {
      setSelectedDate(sortedDates[0]);
    }
  }, [sortedDates, selectedDate]);

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải dữ liệu đơn hàng...</div>;

  // Lấy danh sách đơn của ngày đang chọn
  const currentOrders = selectedDate ? groupedOrders[selectedDate] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center px-2 border-b pb-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileTextIcon /> Quản Lý Đơn Hàng
            </h2>
            <p className="text-sm text-gray-500 mt-1">Danh sách đơn đặt hàng từ khách</p>
        </div>
        <div className="text-right">
            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                Tổng cộng: {orders.length} đơn
            </span>
        </div>
      </div>

      {/* --- CONTENT AREA: DANH SÁCH ĐƠN HÀNG --- */}
      <div className="bg-gray-50 rounded-xl p-4 min-h-[500px] shadow-inner border border-gray-200 relative">
        <AnimatePresence mode="wait">
            {currentOrders && currentOrders.length > 0 ? (
                <motion.div 
                    key={selectedDate}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="font-semibold text-gray-600">
                            Đơn hàng ngày: <span className="text-blue-600">{selectedDate}</span>
                        </h3>
                        <span className="text-xs text-gray-400">Hiển thị {currentOrders.length} đơn</span>
                    </div>
                    
                    {currentOrders.map((order) => (
                        <div key={order._id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:shadow-md transition-all">
                            {/* Thanh màu trạng thái bên trái */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === "Processed" ? "bg-green-500" : "bg-yellow-400"}`} />

                            {/* Cột 1: Thông tin khách hàng */}
                            <div className="flex-1 space-y-2.5 min-w-[220px]">
                                <div className="flex items-center gap-2 font-bold text-gray-800 text-lg">
                                    <User size={18} className="text-blue-600" /> 
                                    {order.customerInfo?.name || "Khách vãng lai"}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <Phone size={14} /> 
                                    <a href={`tel:${order.customerInfo?.phone}`} className="hover:text-blue-600">{order.customerInfo?.phone || "Chưa có SĐT"}</a>
                                </div>
                                <div className="text-sm text-gray-600 flex items-start gap-2">
                                    <MapPin size={14} className="mt-0.5 shrink-0" /> 
                                    <span className="line-clamp-2">{order.customerInfo?.address || "Chưa có địa chỉ"}</span>
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-2 pt-2 border-t border-dashed">
                                    <Clock size={12} /> 
                                    Đặt lúc: {new Date(order.createdAt).toLocaleTimeString("vi-VN")}
                                </div>
                                {order.note && (
                                    <div className="text-xs bg-yellow-50 text-yellow-700 p-2 rounded border border-yellow-100 italic">
                                        " {order.note} "
                                    </div>
                                )}
                            </div>

                            {/* Cột 2: Danh sách sản phẩm */}
                            <div className="flex-[2] border-l pl-0 md:pl-6 border-gray-100 flex flex-col">
                                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                                    <ShoppingBag size={16} /> Chi tiết đơn hàng ({order.products.length} món)
                                </div>
                                
                                <div className="flex-1 space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                    {order.products.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded border border-gray-100">
                                            <img src={p.image} alt="" className="w-10 h-10 object-cover rounded border bg-white" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate text-gray-800">{p.name}</p>
                                                <p className="text-xs text-gray-500">Size: <span className="font-semibold text-gray-700">{p.size || "Mặc định"}</span> | SL: <span className="font-semibold text-gray-700">{p.quantity}</span></p>
                                            </div>
                                            <div className="text-sm font-bold text-gray-700 whitespace-nowrap">
                                                {(p.price * p.quantity).toLocaleString()} 
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-3 flex justify-between items-end pt-2 border-t border-dashed">
                                    <span className="text-sm text-gray-500 font-medium">Tổng tiền đơn hàng:</span>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-blue-600 block leading-none">
                                            {order.totalAmount.toLocaleString()} ₫
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Cột 3: Các nút hành động */}
                            <div className="flex md:flex-col gap-2 justify-center items-end min-w-[150px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 pl-0 md:pl-4 border-gray-100">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold mb-auto w-full text-center ${order.status === "Processed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    {order.status === "Processed" ? "ĐÃ XỬ LÝ" : "CHỜ XỬ LÝ"}
                                </span>

                                <button 
                                    onClick={() => handleToggleStatus(order._id, order.status)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full justify-center transition-all shadow-sm ${
                                        order.status === "Processed" 
                                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300" 
                                        : "bg-green-600 text-white hover:bg-green-700 hover:shadow-md"
                                    }`}
                                >
                                    <CheckCircle size={16} /> 
                                    {order.status === "Processed" ? "Hoàn tác" : "Xác nhận đơn"}
                                </button>

                                <button 
                                    onClick={() => handleDelete(order._id)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full justify-center bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
                                >
                                    <Trash2 size={16} /> Xóa đơn
                                </button>
                            </div>
                        </div>
                    ))}
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                    <ShoppingBag size={48} className="mb-4 text-gray-200" />
                    <p className="text-lg">Không có đơn hàng nào trong ngày <span className="font-semibold text-gray-500">{selectedDate}</span></p>
                </div>
            )}
        </AnimatePresence>
      </div>

      {/* --- THANH ĐIỀU HƯỚNG NGÀY (Tabs ở dưới cùng) --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-40">
         <div className="max-w-6xl mx-auto flex flex-col">
             <p className="text-xs text-gray-400 mb-2 ml-1 font-medium uppercase tracking-wide">Chọn ngày xem đơn hàng:</p>
             <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar px-1 items-center">
                {sortedDates.map((date) => (
                    <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all border flex-shrink-0 flex items-center gap-2
                            ${selectedDate === date 
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg transform -translate-y-1" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-blue-300"
                            }`}
                    >
                        {date}
                        <span className={`text-[10px] py-0.5 px-1.5 rounded-full font-bold ${selectedDate === date ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                            {groupedOrders[date].length}
                        </span>
                    </button>
                ))}
                
                {sortedDates.length === 0 && (
                    <span className="text-sm text-gray-400 italic px-2">Chưa có dữ liệu đơn hàng nào.</span>
                )}
             </div>
         </div>
      </div>
    </div>
  );
};

// Icon helper
const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
);

export default CustomerOrders;