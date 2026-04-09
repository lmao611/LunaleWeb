import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { CheckCircle, Trash2, Clock, MapPin, Phone, User, ShoppingBag, FileText, CreditCard, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import OrderReceipt from "./OrderReceipt"; 
import { useUserStore } from "../stores/useUserStore"; 

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [uncheckedOrders, setUncheckedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [receiptData, setReceiptData] = useState(null); 
  const { socket } = useUserStore();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatOrderId = (order) => {
    if (order.orderId) {
        return `#LN${String(order.orderId).padStart(4, '0')}`;
    }
    return `#${order._id.slice(-6).toUpperCase()}`;
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/customer-orders");
      setOrders(res.data);
      
      const checkedOrdersStr = localStorage.getItem('checked_orders');
      const checkedOrdersList = checkedOrdersStr ? JSON.parse(checkedOrdersStr) : [];

      setUncheckedOrders(res.data.filter(o => o.status === "Pending" && !checkedOrdersList.includes(o._id)));
      setLoading(false);
    } catch (error) {
      toast.error("Lỗi tải danh sách đơn hàng");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
        const audio = new Audio("/notification.mp3"); 
        audio.play().catch(e => {}); 

        toast.success(`Có đơn hàng mới: ${newOrder.orderId ? '#LN'+String(newOrder.orderId).padStart(4,'0') : 'Vừa đặt'}!`, {
            duration: 5000,
            icon: '🔔'
        });

        setOrders((prevOrders) => {
            const exists = prevOrders.find(o => o._id === newOrder._id);
            if (exists) {
                return prevOrders.map(o => o._id === newOrder._id ? newOrder : o);
            } else {
                return [newOrder, ...prevOrders];
            }
        });

        setUncheckedOrders((prev) => {
            const checkedOrdersStr = localStorage.getItem('checked_orders');
            const checkedOrdersList = checkedOrdersStr ? JSON.parse(checkedOrdersStr) : [];
            const exists = prev.find(o => o._id === newOrder._id);
            const isChecked = checkedOrdersList.includes(newOrder._id);

            if (!exists && !isChecked) return [newOrder, ...prev];
            return prev;
        });
    };

    socket.on("newCustomerOrder", handleNewOrder);

    return () => {
        socket.off("newCustomerOrder", handleNewOrder);
    };
  }, [socket]);

  const handleCheckOrder = (order, e) => {
    if (e) e.stopPropagation();
    
    setUncheckedOrders(prev => prev.filter(o => o._id !== order._id));
  
    const checkedOrdersStr = localStorage.getItem('checked_orders');
    let checkedOrdersList = checkedOrdersStr ? JSON.parse(checkedOrdersStr) : [];
    
    if (!checkedOrdersList.includes(order._id)) {
        checkedOrdersList.push(order._id);
        
        if (checkedOrdersList.length > 200) {
            checkedOrdersList.shift(); 
        }
        localStorage.setItem('checked_orders', JSON.stringify(checkedOrdersList));
    }
  };

  const scrollToOrder = (order) => {
    const dateObj = new Date(order.createdAt);
    const dateStr = dateObj.toLocaleDateString("vi-VN");

    if (selectedDate !== dateStr) {
        setSelectedDate(dateStr);
    }

    handleCheckOrder(order);

    setTimeout(() => {
        const element = document.getElementById(`order-${order._id}`);
        if (element) {
            const offset = 100;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            
            element.classList.add("ring-4", "ring-blue-400", "transition-all", "duration-500", "scale-[1.01]");
            setTimeout(() => {
                element.classList.remove("ring-4", "ring-blue-400", "scale-[1.01]");
            }, 2000);
        }
    }, 150);
  };

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
      setUncheckedOrders(prev => prev.filter(o => o._id !== orderId));
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

  const renderPaymentBadge = (method, isPaid) => {
      const isCK = method === "Chuyển khoản";
      return (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border ${
              isCK ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-700 border-gray-200"
          }`}>
              <CreditCard size={12} />
              {method || "COD"}
              {isPaid && <span className="text-green-600 ml-1">(Đã thanh toán)</span>}
          </div>
      );
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải dữ liệu đơn hàng...</div>;

  const currentOrders = selectedDate ? groupedOrders[selectedDate] : [];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 relative pb-20 px-4">
      <AnimatePresence>
        {receiptData && (
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

      <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 min-w-0">
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
                                <div id={`order-${order._id}`} key={order._id} className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === "Processed" ? "bg-green-500" : "bg-yellow-400"}`} />

                                    <div className="flex-1 space-y-2.5 min-w-[220px]">
                                        <div className="flex items-center gap-2 font-bold text-gray-800 text-lg flex-wrap">
                                            <User size={18} className="text-blue-600 shrink-0" /> 
                                            <span className="truncate max-w-[150px] sm:max-w-[200px]">{order.customerInfo?.name || "Khách hàng"}</span>
                                            
                                            {!order.user && (
                                                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                    Khách vãng lai
                                                </span>
                                            )}

                                            <span className="text-xs font-normal text-white bg-blue-500 px-2 py-0.5 rounded-full ml-auto shrink-0">
                                                {formatOrderId(order)}
                                            </span>
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

                                    <div className="flex-[2] border-t pt-4 mt-2 md:border-t-0 md:mt-0 md:pt-0 md:border-l pl-0 md:pl-6 border-gray-100 flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <ShoppingBag size={16} /> Đơn hàng ({order.products.length} món)
                                            </div>
                                            {renderPaymentBadge(order.paymentMethod, order.isPaid)}
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
                                                        {formatCurrency(p.price * p.quantity)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-3 flex justify-between items-end pt-2 border-t border-dashed">
                                            <span className="text-sm text-gray-500 font-medium">Tổng tiền:</span>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-blue-600 block leading-none">
                                                    {formatCurrency(order.totalAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 justify-center items-stretch md:items-end min-w-[160px] border-t pt-4 mt-2 md:border-t-0 md:mt-0 md:pt-0 md:border-l pl-0 md:pl-4 border-gray-100">
                                        
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold w-full text-center uppercase tracking-wide ${order.status === "Processed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                            {order.status === "Processed" ? "ĐÃ XỬ LÝ" : "CHỜ XỬ LÝ"}
                                        </span>

                                        <div className="grid grid-cols-2 md:flex md:flex-col gap-2 w-full">
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

                                            <button 
                                                onClick={() => setReceiptData(order)}
                                                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all"
                                            >
                                                <FileText size={16} /> Phiếu in
                                            </button>

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

          {uncheckedOrders.length > 0 && (
            <div className="w-full xl:w-[320px] shrink-0">
                <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 sticky top-6">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <h3 className="font-bold text-blue-600 flex items-center gap-2">
                            <Bell size={18} className="animate-pulse" /> Đơn Mới
                        </h3>
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {uncheckedOrders.length}
                        </span>
                    </div>
                    
                    <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                        <AnimatePresence>
                            {uncheckedOrders.map(order => (
                                <motion.div 
                                    key={order._id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => scrollToOrder(order)}
                                    className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors group shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className="text-sm font-bold text-gray-800">
                                            {formatOrderId(order)}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-medium">
                                            {new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute:'2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2 truncate">
                                        {order.customerInfo?.name || "Khách hàng"}
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm font-bold text-blue-600">
                                            {formatCurrency(order.totalAmount)}
                                        </span>
                                        <button
                                            onClick={(e) => handleCheckOrder(order, e)}
                                            className="text-[11px] font-semibold bg-white border border-blue-200 text-blue-600 px-2.5 py-1 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
                                        >
                                            Đã check
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default CustomerOrders;