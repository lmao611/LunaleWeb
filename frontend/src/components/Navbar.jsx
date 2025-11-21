import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Home, User, X, Clock } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Navbar = () => {
  const { user, logout, showUserBox, setShowUserBox } = useUserStore();
  const { cart } = useCartStore();
  const isAdmin = user?.role === "admin";
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || "");
  const [editDirection, setEditDirection] = useState(user?.direction || "");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [tokenTimeLeft, setTokenTimeLeft] = useState(null);

  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (showUserBox && user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phoneNumber || "");
      setEditDirection(user.direction || "");
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

        if (timeLeft <= 0) {
          setTokenTimeLeft("Expired");
        } else {
          const m = Math.floor(timeLeft / 60);
          const s = timeLeft % 60;
          setTokenTimeLeft(`${m}:${s < 10 ? "0" : ""}${s}`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } catch (error) {
      console.error(error);
    }
  }, [isAdmin]);

  const handleLogoClick = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 300);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phoneNumber: editPhone,
          direction: editDirection,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setShowUserBox(false);
        alert("Thông tin đã được cập nhật");
      } else {
        alert(data.message || "Lỗi cập nhật");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi máy chủ");
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
          <img
            src="/goback.png"
            alt="Go Back"
            className={`${isMobile ? "w-8 h-8" : "w-9 h-9"} object-contain`}
          />
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
                ? { top: "-15px", left: "50%", x: "-50%", y: 0, scale: 0.55 }
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
          style={isMobile ? undefined : { top: "10px", left: "110px" }}
          onClick={handleLogoClick}
        >
          <img
            src="/lunale.png"
            alt="Lunale"
            className={`${isMobile ? "w-[25vw]" : "w-[120px]"} object-contain`}
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
        <div
          className={`container mx-auto px-4 transition-all duration-500 ${
            isMobile
              ? isScrolled
                ? "pt-[55px] pb-2"
                : "pt-2 pb-2"
              : isScrolled
              ? "py-4"
              : "py-8"
          }`}
        >
          <div
            className={`flex flex-col sm:flex-row items-center pb-2 ${
              isMobile ? "gap-1 justify-center" : "justify-end"
            }`}
          >
            <nav
              className={`flex flex-wrap items-center gap-4 mt-1 sm:mt-0 transition-colors duration-500 ${
                !isScrolled && isHome ? "text-white" : "text-gray-800"
              }`}
            >
              <Link
                to="/"
                className={`flex items-end pb-[2px] transition ${
                  isHome && !isScrolled
                    ? "text-white"
                    : "text-black hover:text-blue-700"
                }`}
                title="Trang Chủ"
              >
                <Home size={22} strokeWidth={2.2} />
              </Link>

              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserBox(true)}
                    className={`transition flex items-end mb-0.5 ${
                      isHome && !isScrolled
                        ? "text-white hover:text-gray-200"
                        : "text-black hover:text-blue-700"
                    }`}
                    title="Thông Tin Cá Nhân"
                  >
                    <User size={20} />
                  </button>
                  {(!user.phoneNumber || !user.direction) && (
                    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white" />
                  )}
                </div>
              )}

              {user && (
                <Link
                  to="/cart"
                  className={`relative group transition flex items-end mb-1.5 ${
                    isHome && !isScrolled
                      ? "text-white hover:text-gray-200"
                      : "text-black hover:text-blue-700"
                  }`}
                >
                  <ShoppingCart size={18} className="mr-1" />
                  <span className="hidden sm:inline pt-1">Giỏ Hàng</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -left-3 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
                      {cart.length}
                    </span>
                  )}
                </Link>
              )}

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/secret-dashboard"
                    className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition"
                  >
                    <Lock className="inline-block mr-1" size={16} />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  {tokenTimeLeft && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono border ${
                      isHome && !isScrolled 
                        ? "bg-black/30 text-white border-white/20" 
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}>
                      <Clock size={12} />
                      <span>{tokenTimeLeft}</span>
                    </div>
                  )}
                </div>
              )}

              {user ? (
                <button
                  onClick={logout}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline ml-2">Đăng Xuất</span>
                </button>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="bg-gray-200 hover:bg-gray-300 text-black px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition"
                  >
                    <UserPlus className="mr-2" size={16} />
                    Đăng Ký
                  </Link>
                  <Link
                    to="/login"
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition"
                  >
                    <LogIn className="mr-2" size={16} />
                    Đăng Nhập
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </motion.header>

      {showUserBox && user && (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center text-center px-6">
          <button
            onClick={() => setShowUserBox(false)}
            className="absolute top-4 right-4 text-gray-600 hover:text-black"
          >
            <X size={28} />
          </button>
          <h2 className="text-2xl font-bold mb-6">Thông Tin Cá Nhân</h2>
          <div className="text-lg space-y-4">
            <div className="text-left space-y-4 w-full max-w-md">
              <label className="block">
                <span className="text-sm font-semibold">Họ Tên:</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 border px-3 py-2 rounded"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Email:</span>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full mt-1 border px-3 py-2 rounded"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Số Điện Thoại:</span>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full mt-1 border px-3 py-2 rounded"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Địa Chỉ:</span>
                <textarea
                  value={editDirection}
                  onChange={(e) => setEditDirection(e.target.value)}
                  className="w-full mt-1 border px-3 py-2 rounded"
                />
              </label>
            </div>
            <button
              onClick={handleUpdateProfile}
              className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Cập Nhật Thông Tin
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;