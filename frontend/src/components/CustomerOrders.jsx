import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { CheckCircle, Trash2, Clock, MapPin, Phone, User, ShoppingBag, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import OrderReceipt from "./OrderReceipt"; 

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const [receiptData, setReceiptData] = useState(null); 

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

  const handleToggleStatus = async (orderId, currentStatus) => {
    const newStatus = currentStatus === "Pending" ? "Processed" : "Pending";
    
    if (newStatus === "Processed") {
       const orderToPrint = orders.find(o => o._id === orderId);
       if (orderToPrint) {
           setReceiptData(orderToPrint);
       }
    }

    try {
      await axios.patch(`/customer-orders/${orderId}`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      toast.success(newStatus === "Processed" ? "Đã xác nhận đơn hàng" : "Đã hoàn tác");
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

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

  const groupedOrders = orders.reduce((groups, order) => {
    const dateObj = new Date(order.createdAt);
    const dateStr = dateObj.toLocaleDateString("vi-VN");
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(order);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
    const [d1, m1, y1] = a.split("/");
    const [d2, m2, y2] = b.split("/");
    return new Date(`${y2}-${m2}-${d2}`) - new Date(`${y1}-${m1}-${d1}`);
  });

  useEffect(() => {
    if (sortedDates.length > 0 && !selectedDate) {
      setSelectedDate(sortedDates[0]);
    }
  }, [sortedDates, selectedDate]);

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải dữ liệu đơn hàng...</div>;

  const currentOrders = selectedDate ? groupedOrders[selectedDate] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative pb-20">
      {/* --- POPUP PHIẾU IN --- */}
      <AnimatePresence>
        {receiptData && (
            // FIX 1: Tăng z-index lên 99999 để đè lên Navbar (Navbar thường là z-50 hoặc z-100)
            // FIX 2: Tăng pt-24 (96px) để nội dung tụt xuống dưới Navbar, không bị che nút đóng
            <div className="fixed inset-0 z-[99999] bg-black/60 flex items-start justify-center overflow-y-auto pt-24 pb-10 px-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl relative"
                >
                    <OrderReceipt 
                        inputOrder={receiptData} 
                        onClose={() => setReceiptData(null)} 
                    />
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center px-2 border-b pb-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-blue-600" size={24} /> Quản Lý Đơn Hàng
            </h2>
            <p className="text-sm text-gray-500 mt-1">Danh sách đơn đặt hàng từ khách</p>
        </div>
        <div className="text-right">
            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {orders.length} đơn
            </span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 min-h-[500px] shadow-inner border border-gray-200 relative">
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
                            Ngày: <span className="text-blue-600">{selectedDate}</span>
                        </h3>
                        <span className="text-xs text-gray-400">{currentOrders.length} đơn</span>
                    </div>
                    
                    {currentOrders.map((order) => (
                        <div key={order._id} className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:shadow-md transition-all">
                            {/* Thanh trạng thái màu bên trái */}
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

                            {/* Cột 2: Chi tiết sản phẩm */}
                            <div className="flex-[2] border-t pt-4 mt-2 md:border-t-0 md:mt-0 md:pt-0 md:border-l pl-0 md:pl-6 border-gray-100 flex flex-col">
                                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                                    <ShoppingBag size={16} /> Đơn hàng ({order.products.length} món)
                                </div>
                                
                                <div className="flex-1 space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                    {order.products.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded border border-gray-100">
                                            <img src={p.image} alt="" className="w-10 h-10 object-cover rounded border bg-white" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate text-gray-800">{p.name}</p>
                                                <p className="text-xs text-gray-500">Size: <span className="font-semibold text-gray-700">{p.size || "M"}</span> | SL: <span className="font-semibold text-gray-700">{p.quantity}</span></p>
                                            </div>
                                            <div className="text-sm font-bold text-gray-700 whitespace-nowrap">
                                                {(p.price * p.quantity).toLocaleString()} 
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-3 flex justify-between items-end pt-2 border-t border-dashed">
                                    <span className="text-sm text-gray-500 font-medium">Tổng tiền:</span>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-blue-600 block leading-none">
                                            {order.totalAmount.toLocaleString()} ₫
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Cột 3: Hành động (ĐÃ SỬA BỐ CỤC MOBILE) */}
                            {/* Chuyển flex-row thành flex-col để các nút nằm dọc, to rõ hơn */}
                            <div className="flex flex-col gap-3 justify-center items-stretch md:items-end min-w-[160px] border-t pt-4 mt-2 md:border-t-0 md:mt-0 md:pt-0 md:border-l pl-0 md:pl-4 border-gray-100">
                                
                                {/* Trạng thái: Full width */}
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold w-full text-center uppercase tracking-wide ${order.status === "Processed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    {order.status === "Processed" ? "ĐÃ XỬ LÝ" : "CHỜ XỬ LÝ"}
                                </span>

                                {/* Nút bấm: Chia lưới 2 cột trên mobile */}
                                <div className="grid grid-cols-2 md:flex md:flex-col gap-2 w-full">
                                    
                                    {/* Nút Xác nhận/Hoàn tác: Full width trên mobile (col-span-2) để dễ bấm nhất */}
                                    <button 
                                        onClick={() => handleToggleStatus(order._id, order.status)}
                                        className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold w-full transition-all shadow-sm ${
                                            order.status === "Processed" 
                                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300" 
                                            : "bg-green-600 text-white hover:bg-green-700 hover:shadow-md"
                                        }`}
                                    >
                                        <CheckCircle size={18} /> 
                                        {order.status === "Processed" ? "Hoàn tác" : "Xác nhận đơn"}
                                    </button>

                                    {/* Nút Xem phiếu */}
                                    <button 
                                        onClick={() => setReceiptData(order)}
                                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all"
                                    >
                                        <FileText size={16} /> Phiếu in
                                    </button>

                                    {/* Nút Xóa */}
                                    <button 
                                        onClick={() => handleDelete(order._id)}
                                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
                                    >
                                        <Trash2 size={16} /> Xóa
                                    </button>
                                </div>
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

      <div className="mt-8 pt-4 border-t">
         <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Chọn ngày xem đơn hàng:</p>
         <div className="flex overflow-x-auto gap-3 pb-4">
            {sortedDates.map((date) => (
                <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all border flex-shrink-0 flex items-center gap-2
                        ${selectedDate === date 
                            ? "bg-blue-600 text-white border-blue-600 shadow-md transform -translate-y-1" 
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
                <span className="text-sm text-gray-400 italic">Chưa có dữ liệu đơn hàng nào.</span>
            )}
         </div>
      </div>
    </div>
  );
};

export default CustomerOrders;