import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Home, User, X, Clock, Package, History, Edit2, Save, XCircle, ChevronLeft, MapPin, Phone, CreditCard } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";

const Navbar = () => {
  const { user, logout, showUserBox, setShowUserBox } = useUserStore();
  const { cart } = useCartStore();
  const isAdmin = user?.role === "admin" || user?.role === "controller";
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  
  // --- STATE PROFILE ---
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || "");
  const [editDirection, setEditDirection] = useState(user?.direction || "");

  // --- STATE NAVBAR ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [tokenTimeLeft, setTokenTimeLeft] = useState(null);

  // --- STATE ĐƠN HÀNG & TAB ---
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'orders'
  const [orders, setOrders] = useState([]); 
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // State chỉnh sửa địa chỉ nhanh
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editOrderAddress, setEditOrderAddress] = useState("");
  
  // State xem chi tiết đơn hàng
  const [selectedOrder, setSelectedOrder] = useState(null);

  const setUser = useUserStore((state) => state.setUser);

  // --- EFFECTS ---
  useEffect(() => {
    if (showUserBox && user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phoneNumber || "");
      setEditDirection(user.direction || "");
      setActiveTab("profile"); 
      setSelectedOrder(null); 
    }
  }, [showUserBox, user]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isHome) {
      setIsScrolled(false);
      const handleScroll = () => setIsScrolled(window.scrollY > 0);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setIsScrolled(true);
    }
  }, [isHome]);

  useEffect(() => {
    if (!isAdmin) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!payload.exp) return;
      const updateTimer = () => {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = payload.exp - now;
        if (timeLeft <= 0) setTokenTimeLeft("Expired");
        else {
          const m = Math.floor(timeLeft / 60);
          const s = timeLeft % 60;
          setTokenTimeLeft(`${m}:${s < 10 ? "0" : ""}${s}`);
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } catch (error) { console.error(error); }
  }, [isAdmin]);

  // --- API CALLS ---
  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      // QUAN TRỌNG: Gọi API riêng cho khách hàng để chỉ lấy đơn của mình
      const res = await axios.get("/customer-orders/my-orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      // Nếu lỗi 404 (chưa có backend mới), tạm thời set rỗng để không lỗi giao diện
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (showUserBox && activeTab === "orders") {
      fetchMyOrders();
      setSelectedOrder(null);
    }
  }, [showUserBox, activeTab]);

  // --- HANDLERS ---
  const handleLogoClick = () => {
    if (isHome) window.scrollTo({ top: 0, behavior: "smooth" });
    else {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 300);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/");
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await axios.put("/auth/profile", {
        name: editName,
        email: editEmail,
        phoneNumber: editPhone,
        direction: editDirection,
      });
      if (res.status === 200) {
        setUser(res.data);
        alert("Thông tin đã được cập nhật");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi cập nhật");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    try {
      await axios.put(`/customer-orders/${orderId}/cancel`); 
      alert("Đã hủy đơn hàng thành công.");
      fetchMyOrders(); 
      if (selectedOrder) setSelectedOrder(null);
    } catch (error) {
      alert(error.response?.data?.message || "Không thể hủy đơn hàng.");
    }
  };

  const startEditOrder = (order) => {
    setEditingOrderId(order._id);
    // Ưu tiên lấy địa chỉ trong customerInfo (snapshot lúc đặt), nếu không có thì lấy address gốc
    setEditOrderAddress(order.customerInfo?.address || order.address || "");
  };

  const saveOrderAddress = async (orderId) => {
    try {
      await axios.put(`/customer-orders/${orderId}/address`, { address: editOrderAddress });
      alert("Cập nhật địa chỉ nhận hàng thành công.");
      setEditingOrderId(null);
      fetchMyOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi cập nhật địa chỉ đơn hàng.");
    }
  };

  // --- HELPERS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending" || s === "chờ xử lý") return <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-bold">Đang xử lý</span>;
    if (s === "processed" || s === "shipping" || s === "đang giao") return <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs font-bold">Đã xác nhận</span>;
    if (s === "delivered" || s === "đã giao") return <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold">Hoàn thành</span>;
    if (s === "cancelled" || s === "đã hủy") return <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold">Đã hủy</span>;
    return <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">{status}</span>;
  };

  const isEditable = (status) => {
    const s = status?.toLowerCase() || "";
    return s === "pending" || s === "chờ xử lý";
  };

  return (
    <>
      {!isHome && (
        <button
          onClick={handleGoBack}
          className={`fixed z-[150] top-[12px] sm:top-[14px] flex items-center justify-center transition-all hover:opacity-80 ${
            isMobile ? "left-3" : "left-6"
          }`}
          title="Quay lại"
        >
          <img src="/goback.png" alt="Go Back" className={`${isMobile ? "w-8 h-8" : "w-9 h-9"} object-contain`} />
        </button>
      )}

      {isHome ? (
        <motion.div
          className="fixed z-[100] cursor-pointer"
          onClick={handleLogoClick}
          initial={{ top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 3 }}
          animate={
            isScrolled
              ? isMobile
                ? { top: "-13px", left: "50%", x: "-50%", y: 0, scale: 0.55 }
                : { top: "-15px", left: "50px", x: 0, y: 0, scale: 0.55 }
              : isMobile
              ? { top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1.8 }
              : { top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 3 }
          }
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.img
            src="/lunale.png"
            alt="Lunale"
            className={`object-contain transition-all duration-700 ${
              isScrolled ? "filter-none" : "brightness-0 invert"
            } ${isMobile ? "w-[70vw]" : "w-[250px]"}`}
          />
        </motion.div>
      ) : (
        <div
          className={`fixed z-[100] cursor-pointer ${
            isMobile ? "top-2 left-1/2 -translate-x-1/2" : ""
          }`}
          style={isMobile ? undefined : { top: "8px", left: "106px" }}
          onClick={handleLogoClick}
        >
          <img
            src="/lunale.png"
            alt="Lunale"
            className={`${isMobile ? "w-[28vw]" : "w-[140px]"} object-contain`}
          />
        </div>
      )}

      <motion.header
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${
          isScrolled || !isHome
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200"
            : "bg-transparent"
        } ${isMobile ? "min-h-[55px] pt-[env(safe-area-inset-top)]" : ""}`}
      >
        <div className={`container mx-auto px-4 transition-all duration-500 ${isMobile ? (isScrolled ? "pt-[55px] pb-2" : "pt-2 pb-2") : (isScrolled ? "py-4" : "py-8")}`}>
          <div className={`flex flex-col sm:flex-row items-center pb-2 ${isMobile ? "gap-1 justify-center" : "justify-end"}`}>
            <nav className={`flex flex-wrap items-center gap-4 mt-1 sm:mt-0 transition-colors duration-500 ${!isScrolled && isHome ? "text-white" : "text-gray-800"}`}>
              <Link to="/" className={`flex items-end pb-[2px] transition ${isHome && !isScrolled ? "text-white" : "text-black hover:text-blue-700"}`}>
                <Home size={22} strokeWidth={2.2} />
              </Link>
              {user && (
                <div className="relative">
                  <button onClick={() => setShowUserBox(true)} className={`transition flex items-end mb-0.5 ${isHome && !isScrolled ? "text-white hover:text-gray-200" : "text-black hover:text-blue-700"}`}>
                    <User size={20} />
                  </button>
                  {(!user.phoneNumber || !user.direction) && <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white" />}
                </div>
              )}
              {user && (
                <Link to="/cart" className={`relative group transition flex items-end mb-1.5 ${isHome && !isScrolled ? "text-white hover:text-gray-200" : "text-black hover:text-blue-700"}`}>
                  <ShoppingCart size={18} className="mr-1" />
                  <span className="hidden sm:inline pt-1">Giỏ Hàng</span>
                  {cart.length > 0 && <span className="absolute -top-2 -left-3 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">{cart.length}</span>}
                </Link>
              )}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Link to="/secret-dashboard" className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition">
                    <Lock className="inline-block mr-1" size={16} /> <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  {tokenTimeLeft && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono border ${isHome && !isScrolled ? "bg-black/30 text-white border-white/20" : "bg-red-50 text-red-600 border-red-100"}`}>
                      <Clock size={12} /> <span>{tokenTimeLeft}</span>
                    </div>
                  )}
                </div>
              )}
              {user ? (
                <button onClick={logout} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition">
                  <LogOut size={16} /> <span className="hidden sm:inline ml-2">Đăng Xuất</span>
                </button>
              ) : (
                <>
                  <Link to="/signup" className="bg-gray-200 hover:bg-gray-300 text-black px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition">
                    <UserPlus className="mr-2" size={16} /> Đăng Ký
                  </Link>
                  <Link to="/login" className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition">
                    <LogIn className="mr-2" size={16} /> Đăng Nhập
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* --- USER BOX MODAL --- */}
      <AnimatePresence>
        {showUserBox && user && (
          <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] max-h-[800px] flex flex-col relative overflow-hidden"
            >
              <button onClick={() => setShowUserBox(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black z-10 transition">
                <X size={24} />
              </button>

              {/* Header / Tabs */}
              <div className="flex border-b shrink-0">
                <button
                  onClick={() => {setActiveTab("profile"); setSelectedOrder(null);}}
                  className={`flex-1 py-4 font-semibold text-lg flex items-center justify-center gap-2 transition ${activeTab === "profile" ? "text-blue-700 border-b-2 border-blue-700 bg-blue-50" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  <User size={20} /> Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`flex-1 py-4 font-semibold text-lg flex items-center justify-center gap-2 transition ${activeTab === "orders" ? "text-blue-700 border-b-2 border-blue-700 bg-blue-50" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  <History size={20} /> Đơn hàng đã đặt
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
                {activeTab === "profile" ? (
                  <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm">
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Họ Tên</span>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full mt-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Email</span>
                        <input type="email" value={editEmail} disabled className="w-full mt-1 border border-gray-300 px-3 py-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Số Điện Thoại</span>
                        <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full mt-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Địa Chỉ</span>
                        <textarea value={editDirection} onChange={(e) => setEditDirection(e.target.value)} rows="3" className="w-full mt-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                      </label>
                    </div>
                    <button onClick={handleUpdateProfile} className="w-full mt-6 bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 rounded transition shadow-md">
                      Lưu Thay Đổi
                    </button>
                  </div>
                ) : (
                  // --- ORDER HISTORY TAB ---
                  <>
                    {selectedOrder ? (
                      // VIEW 1: CHI TIẾT ĐƠN HÀNG
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col"
                      >
                        {/* Header Chi tiết */}
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="flex items-center text-gray-600 hover:text-blue-700 transition"
                            >
                                <ChevronLeft size={20} /> Quay lại
                            </button>
                            <span className="font-bold text-gray-800">#{ (selectedOrder._id).slice(-6).toUpperCase() }</span>
                        </div>

                        {/* Body Chi tiết */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Trạng thái */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</span>
                                {getStatusBadge(selectedOrder.status)}
                            </div>

                            {/* Thông tin nhận hàng */}
                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded border">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2"><MapPin size={16}/> Địa chỉ nhận hàng</h4>
                                    <p className="text-gray-600">{selectedOrder.customerInfo?.address || selectedOrder.address || "Chưa có địa chỉ"}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2"><CreditCard size={16}/> Phương thức thanh toán</h4>
                                    <p className="text-gray-600">COD (Thanh toán khi nhận hàng)</p>
                                </div>
                            </div>

                            {/* Danh sách sản phẩm chi tiết */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Package size={16}/> Sản phẩm</h4>
                                <div className="space-y-3">
                                    {selectedOrder.products?.map((item, idx) => (
                                        <div key={idx} className="flex gap-3 items-center border-b pb-3 last:border-0">
                                            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                <img src={item.image || "/placeholder.png"} alt="Product" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800 text-sm line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-gray-500">Size: {item.size} | SL: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-blue-700 text-sm">{formatCurrency((item.price || 0) * item.quantity)}</p>
                                                <p className="text-xs text-gray-400">{formatCurrency(item.price)}/sp</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Tổng tiền */}
                        <div className="p-4 bg-gray-50 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tạm tính:</span>
                                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-blue-700 pt-2 border-t">
                                <span>Tổng cộng:</span>
                                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                            </div>
                            {/* Nút hủy trong chi tiết */}
                            {isEditable(selectedOrder.status) && (
                                <button 
                                    onClick={() => handleCancelOrder(selectedOrder._id)}
                                    className="w-full mt-2 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 font-medium transition"
                                >
                                    Hủy đơn hàng này
                                </button>
                            )}
                        </div>
                      </motion.div>
                    ) : (
                      // VIEW 2: DANH SÁCH ĐƠN HÀNG
                      <div className="space-y-4">
                        {loadingOrders ? (
                          <div className="text-center py-10 text-gray-500">Đang tải lịch sử đơn hàng...</div>
                        ) : orders.length === 0 ? (
                          <div className="text-center py-10 flex flex-col items-center text-gray-500">
                            <Package size={48} className="mb-2 text-gray-300" />
                            <p>Bạn chưa có đơn hàng nào.</p>
                            <button onClick={() => {setShowUserBox(false); navigate('/')}} className="mt-4 text-blue-600 hover:underline">
                              Mua sắm ngay
                            </button>
                          </div>
                        ) : (
                          orders.map((order) => (
                            <div key={order._id} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 transition hover:shadow-md">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 mb-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-gray-800">#{ (order._id).slice(-6).toUpperCase() }</span>
                                    {getStatusBadge(order.status)}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="block text-sm text-gray-500">Tổng tiền</span>
                                  <span className="font-bold text-xl text-blue-700">{formatCurrency(order.totalAmount)}</span>
                                </div>
                              </div>

                              <div className="space-y-2 mb-4">
                                 {order.products && order.products.slice(0, 2).map((item, idx) => (
                                   <div key={idx} className="flex justify-between text-sm text-gray-600">
                                      <span>{item.quantity}x {item.name} (Size: {item.size})</span>
                                      <span>{formatCurrency((item.price || 0) * item.quantity)}</span>
                                   </div>
                                 ))}
                                 {order.products && order.products.length > 2 && (
                                   <p className="text-xs text-gray-400 italic">+ {order.products.length - 2} sản phẩm khác...</p>
                                 )}
                              </div>
                              
                              <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                                 <div className="flex items-start justify-between">
                                    <div className="flex-1 mr-2">
                                       <span className="font-semibold text-gray-700 block mb-1">Địa chỉ nhận hàng:</span>
                                       {editingOrderId === order._id ? (
                                         <div className="flex gap-2">
                                           <input 
                                             type="text" 
                                             value={editOrderAddress}
                                             onChange={(e) => setEditOrderAddress(e.target.value)}
                                             className="flex-1 border px-2 py-1 rounded text-sm outline-none focus:border-blue-500"
                                           />
                                           <button onClick={() => saveOrderAddress(order._id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={16}/></button>
                                           <button onClick={() => setEditingOrderId(null)} className="text-red-500 hover:bg-red-100 p-1 rounded"><XCircle size={16}/></button>
                                         </div>
                                       ) : (
                                         <span className="text-gray-600 line-clamp-2">{order.customerInfo?.address || order.address || "Chưa có địa chỉ"}</span>
                                       )}
                                    </div>
                                    {isEditable(order.status) && editingOrderId !== order._id && (
                                       <button onClick={() => startEditOrder(order)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs shrink-0">
                                         <Edit2 size={12} /> Sửa
                                       </button>
                                    )}
                                 </div>
                                 
                                 <div className="pt-2 flex justify-end gap-3 mt-2 border-t border-gray-200">
                                    {isEditable(order.status) && (
                                      <button 
                                        onClick={() => handleCancelOrder(order._id)}
                                        className="px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 text-xs font-medium transition"
                                      >
                                        Hủy đơn
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => setSelectedOrder(order)}
                                      className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium transition"
                                    >
                                      Xem chi tiết
                                    </button>
                                 </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;