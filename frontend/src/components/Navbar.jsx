import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Home } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const { cart } = useCartStore();
  const isAdmin = user?.role === "admin";
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

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

  return (
    <>
      {/* ✅ Logo */}
      {isHome ? (
        <motion.div
          className="fixed z-[100] cursor-pointer"
          onClick={handleLogoClick}
          initial={{ top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 3 }}
          animate={
            isScrolled
              ? isMobile
                ? {
                    top: "-15px",
                    left: "50%",
                    x: "-50%",
                    y: 0,
                    scale: 0.55,
                  }
                : {
                    top: "-15px",
                    left: "50px",
                    x: 0,
                    y: 0,
                    scale: 0.55,
                  }
              : isMobile
              ? {
                  top: "50%",
                  left: "50%",
                  x: "-50%",
                  y: "-50%",
                  scale: 1.8,
                }
              : {
                  top: "50%",
                  left: "50%",
                  x: "-50%",
                  y: "-50%",
                  scale: 3,
                }
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

      {/* ✅ Navbar */}
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
            className={`flex flex-col sm:flex-row items-center justify-end ${
              isMobile ? "gap-1" : ""
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
                <Link
                  to="/cart"
                  className={`relative group transition flex items-end ${
                    isHome && !isScrolled
                      ? "text-white hover:text-gray-200"
                      : "text-black hover:text-blue-700"
                  }`}
                >
                  <ShoppingCart className="inline-block mr-1" size={18} />
                  <span className="hidden sm:inline">Giỏ Hàng</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -left-3 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
                      {cart.length}
                    </span>
                  )}
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/secret-dashboard"
                  className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition"
                >
                  <Lock className="inline-block mr-1" size={16} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md flex items-center transition"
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
    </>
  );
};

export default Navbar;