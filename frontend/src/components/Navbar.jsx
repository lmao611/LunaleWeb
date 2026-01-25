import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Home, User, X, Clock, Package, History, Edit2, Save, XCircle, ChevronLeft, MapPin, Phone, CreditCard, Bell, Trash2, Camera } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useChatStore } from "../stores/useChatStore";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";

const Navbar = () => {
  const { user, logout, showUserBox, setShowUserBox, socket, setUser } = useUserStore();
  const { cart } = useCartStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, addRealtimeNotification } = useNotificationStore();
  const { openChat, setSelectedUser } = useChatStore();
  
  const isAdmin = user?.role === "admin" || user?.role === "controller";
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || "");
  const [editDirection, setEditDirection] = useState(user?.direction || "");
  
  // State cho Avatar
  const [newAvatar, setNewAvatar] = useState(""); 
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || ""); 
  const fileInputRef = useRef(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [tokenTimeLeft, setTokenTimeLeft] = useState(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState([]); 
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editOrderAddress, setEditOrderAddress] = useState("");
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (data) => {
        addRealtimeNotification(data);
    };
    socket.on("newNotification", handleNewNotification);
    return () => socket.off("newNotification", handleNewNotification);
  }, [socket, addRealtimeNotification]);

  useEffect(() => {
    if (user) {
        fetchNotifications();
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (showUserBox && user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phoneNumber || "");
      setEditDirection(user.direction || "");
      setAvatarPreview(user.avatar || ""); 
      setNewAvatar(""); 
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

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await axios.get("/customer-orders/my-orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatOrderId = (order) => {
    if (order.orderId) return `#LN${String(order.orderId).padStart(4, '0')}`;
    return `#${order._id.slice(-6).toUpperCase()}`;
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

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
        markAsRead(notif._id);
    }
    setShowNotifications(false);

    if (notif.type === "message" && notif.relatedId) {
        if (isAdmin) {
            try {
                const res = await axios.get(`/messages/users`); 
                const sender = res.data.find(u => u._id === notif.relatedId);
                if (sender) {
                    setSelectedUser(sender);
                    navigate("/secret-dashboard"); 
                }
            } catch (err) {
                console.error("Không tìm thấy user để chat:", err);
            }
        } else {
            openChat();
        }
    } else {
        setSelectedNotification(notif);
    }
  };

  // --- HÀM NÉN ẢNH (MỚI) ---
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            // Giới hạn chiều rộng tối đa 500px (đủ cho avatar)
            const MAX_WIDTH = 500; 
            const scaleSize = MAX_WIDTH / img.width;
            
            // Nếu ảnh nhỏ hơn 500px thì giữ nguyên, lớn hơn thì scale xuống
            if (scaleSize < 1) {
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Xuất ra dạng JPEG chất lượng 0.7 (giảm dung lượng đáng kể)
            callback(canvas.toDataURL("image/jpeg", 0.7));
        };
    };
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Gọi hàm nén ảnh trước khi set state
    compressImage(file, (compressedResult) => {
        setNewAvatar(compressedResult); 
        setAvatarPreview(compressedResult); 
    });
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await axios.put("/auth/profile", {
        name: editName,
        email: editEmail,
        phoneNumber: editPhone,
        direction: editDirection,
        avatar: newAvatar,
      });
      if (res.status === 200) {
        setUser(res.data);
        setNewAvatar(""); 
        alert("Thông tin đã được cập nhật");
      }
    } catch (err) {
      console.error("Lỗi update profile:", err);
      // Hiển thị message lỗi cụ thể nếu server trả về
      alert(err.response?.data?.message || "Lỗi cập nhật. Vui lòng kiểm tra kết nối hoặc thử ảnh khác.");
    }
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
                ? { top: "-10.7px", left: "50%", x: "-50%", y: 0, scale: 0.55 }
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
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`transition flex items-end mb-0.5 relative ${isHome && !isScrolled ? "text-white hover:text-gray-200" : "text-black hover:text-blue-700"}`}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
              )}

              {user && (
                <div className="relative">
                  <button onClick={() => setShowUserBox(true)} className={`transition flex items-center mb-0.5 ${isHome && !isScrolled ? "text-white hover:text-gray-200" : "text-black hover:text-blue-700"}`}>
                    {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-gray-200" />
                    ) : (
                        <User size={20} />
                    )}
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

      <AnimatePresence>
        {showNotifications && (
            <>
                <div className="fixed inset-0 z-[190]" onClick={() => setShowNotifications(false)}></div>
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed top-[65px] right-2 sm:right-40 z-[200] w-[90vw] sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                >
                    <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Thông báo</h3>
                        <span className="text-xs text-gray-500">{notifications.length} tin</span>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Chưa có thông báo nào</div>
                        ) : (
                            notifications.map((notif) => (
                                <div 
                                    key={notif._id} 
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition flex gap-3 ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                                >
                                    {notif.image ? (
                                        <img src={notif.image} alt="img" className="w-12 h-12 rounded object-cover flex-shrink-0 bg-gray-200" />
                                    ) : (
                                        <div className="w-12 h-12 rounded bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                            <Bell size={20} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm line-clamp-2 ${!notif.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notif.createdAt).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                    {!notif.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUserBox && user && (
          <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] max-h-[800px] flex flex-col relative overflow-hidden"
            >
              <button 
                onClick={() => setShowUserBox(false)} 
                className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-red-600 z-50 transition p-1.5 bg-white/60 rounded-full hover:bg-red-50"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>

              <div className="flex shrink-0">
                <button
                  onClick={() => {setActiveTab("profile"); setSelectedOrder(null);}}
                  className={`flex-1 py-4 sm:py-5 font-bold text-sm sm:text-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-colors duration-300 ${activeTab === "profile" ? "bg-black text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}
                >
                  <User size={20} className="sm:w-5 sm:h-5" /> Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`flex-1 py-4 sm:py-5 font-bold text-sm sm:text-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-colors duration-300 pr-10 sm:pr-0 ${activeTab === "orders" ? "bg-black text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}
                >
                  <History size={20} className="sm:w-5 sm:h-5" /> Đơn hàng đã đặt
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
                {activeTab === "profile" ? (
                  <div className="max-w-md mx-auto bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Họ Tên</span>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full mt-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Email</span>
                        <input type="email" value={editEmail} disabled className="w-full mt-1 border border-gray-300 px-3 py-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed text-sm sm:text-base" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Số Điện Thoại</span>
                        <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full mt-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700">Địa Chỉ</span>
                        <textarea value={editDirection} onChange={(e) => setEditDirection(e.target.value)} rows="3" className="w-full mt-1 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm sm:text-base" />
                      </label>
                    </div>

                    {/* --- PHẦN UPLOAD ẢNH (ĐÃ CẬP NHẬT: TRÊN NÚT LƯU) --- */}
                    <div className="mt-4 mb-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Ảnh đại diện</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-300 shrink-0">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User size={24} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImageChange} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs sm:text-sm rounded transition mb-1"
                                >
                                    <Camera size={14} /> Chọn ảnh mới
                                </button>
                                <p className="text-[10px] text-gray-500">
                                    Ảnh sẽ được lưu khi bấm "Lưu Thay Đổi"
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* ---------------------------------- */}

                    <button onClick={handleUpdateProfile} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 rounded transition shadow-md text-sm sm:text-base">
                      Lưu Thay Đổi
                    </button>

                  </div>
                ) : (
                  <>
                    {selectedOrder ? (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col"
                      >
                        <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-gray-50">
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="flex items-center text-gray-600 hover:text-blue-700 transition text-sm sm:text-base"
                            >
                                <ChevronLeft size={20} /> Quay lại
                            </button>
                            <span className="font-bold text-gray-800 text-sm sm:text-base">{formatOrderId(selectedOrder)}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-xs sm:text-sm text-gray-500">Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</span>
                                {getStatusBadge(selectedOrder.status)}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded border">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2"><MapPin size={16}/> Địa chỉ nhận hàng</h4>
                                    <p className="text-gray-600 text-xs sm:text-sm">{selectedOrder.customerInfo?.address || selectedOrder.address || "Chưa có địa chỉ"}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2"><CreditCard size={16}/> Thanh toán</h4>
                                    <p className="text-gray-600 text-xs sm:text-sm">
                                        {selectedOrder.paymentMethod || "COD"}
                                        {selectedOrder.isPaid && <span className="ml-2 text-green-600 font-bold">(Đã thanh toán)</span>}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Package size={16}/> Sản phẩm</h4>
                                <div className="space-y-3">
                                    {selectedOrder.products?.map((item, idx) => (
                                        <div key={idx} className="flex gap-3 items-center border-b pb-3 last:border-0">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
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

                        <div className="p-4 bg-gray-50 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tạm tính:</span>
                                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-blue-700 pt-2 border-t">
                                <span>Tổng cộng:</span>
                                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                            </div>
                            {isEditable(selectedOrder.status) && (
                                <button 
                                    onClick={() => handleCancelOrder(selectedOrder._id)}
                                    className="w-full mt-2 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 font-medium transition text-sm"
                                >
                                    Hủy đơn hàng này
                                </button>
                            )}
                        </div>
                      </motion.div>
                    ) : (
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
                            <div key={order._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition hover:shadow-md">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-4 border-b pb-3 mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-base sm:text-lg text-gray-800">{formatOrderId(order)}</span>
                                    {getStatusBadge(order.status)}
                                    {order.isPaid && (
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                            Đã thanh toán
                                        </span>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                                  </p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <span className="block text-xs sm:text-sm text-gray-500">Tổng tiền</span>
                                  <span className="font-bold text-lg sm:text-xl text-blue-700">{formatCurrency(order.totalAmount)}</span>
                                </div>
                              </div>

                              <div className="space-y-2 mb-4">
                                 {order.products && order.products.slice(0, 2).map((item, idx) => (
                                   <div key={idx} className="flex justify-between text-sm text-gray-600">
                                      <span className="line-clamp-1 flex-1 pr-2">{item.quantity}x {item.name} (Size: {item.size})</span>
                                      <span className="shrink-0">{formatCurrency((item.price || 0) * item.quantity)}</span>
                                   </div>
                                 ))}
                                 {order.products && order.products.length > 2 && (
                                   <p className="text-xs text-gray-400 italic">+ {order.products.length - 2} sản phẩm khác...</p>
                                 )}
                              </div>
                              
                              <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                                 <div className="flex items-start justify-between">
                                    <div className="flex-1 mr-2 min-w-0">
                                       <span className="font-semibold text-gray-700 block mb-1 text-xs sm:text-sm">Địa chỉ nhận hàng:</span>
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
                                         <span className="text-gray-600 line-clamp-2 text-xs sm:text-sm">{order.customerInfo?.address || order.address || "Chưa có địa chỉ"}</span>
                                       )}
                                    </div>
                                    {isEditable(order.status) && editingOrderId !== order._id && (
                                       <button onClick={() => startEditOrder(order)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs shrink-0">
                                         <Edit2 size={12} /> Sửa
                                       </button>
                                    )}
                                 </div>
                                 
                                 <div className="pt-2 flex justify-end gap-2 sm:gap-3 mt-2 border-t border-gray-200">
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