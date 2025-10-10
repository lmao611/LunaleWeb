import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const { cart } = useCartStore();
  const isAdmin = user?.role === "admin";
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [isScrolled, setIsScrolled] = useState(false);
  const [preventInitialAnim, setPreventInitialAnim] = useState(true);

  // ✅ Ensure big state on homepage when first loaded
  useEffect(() => {
    if (isHome) {
      setIsScrolled(false); // Start in big state
      const handleScroll = () => setIsScrolled(window.scrollY > 50);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setIsScrolled(true); // Always small on other routes
    }
  }, [location.pathname]);

  // ✅ Reset scroll and animation flag on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setPreventInitialAnim(true);
    const timeout = setTimeout(() => setPreventInitialAnim(false), 100);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <>
      {/* Top white bar */}
      <div className="fixed top-0 left-0 w-full h-5 bg-white z-[60]" />

      {/* Navbar */}
      <motion.header
        layout={isHome}
        initial={false}
        animate={{
          y: isHome ? 0 : undefined,
          opacity: 1,
        }}
        transition={{
          duration: preventInitialAnim ? 0 : 0.5,
          ease: "easeInOut",
        }}
        className={`fixed top-0 left-0 w-full z-50 ${
          isScrolled
            ? "bg-white shadow-md border-b border-gray-200"
            : "bg-white shadow-lg"
        }`}
      >
        <div
          className={`container mx-auto px-4 transition-all duration-500 ${
            isScrolled ? "py-2" : "py-8"
          }`}
        >
          <motion.div
            layout={isHome}
            transition={{
              duration: preventInitialAnim ? 0 : 0.5,
              ease: "easeInOut",
            }}
            className={`flex flex-col items-center ${
              isScrolled ? "sm:flex-row sm:justify-between" : "sm:flex-col"
            }`}
          >
            {/* Logo */}
            <motion.div
              layout={isHome}
              transition={{
                duration: preventInitialAnim ? 0 : 0.5,
                ease: "easeInOut",
              }}
              className="flex justify-center"
            >
              <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                <motion.img
                  layout={isHome}
                  transition={{
                    duration: preventInitialAnim ? 0 : 0.5,
                    ease: "easeInOut",
                  }}
                  src="./lunale.png"
                  alt="Lunale"
                  className={`object-contain transition-all duration-500 ${
                    isScrolled ? "h-12 sm:h-14" : "h-28 sm:h-32"
                  }`}
                />
              </Link>
            </motion.div>

            {/* Navigation */}
            <motion.nav
              layout={isHome}
              animate={{
                opacity: isScrolled ? 1 : 0,
                y: isHome && !isScrolled ? -10 : 0,
              }}
              transition={{
                duration: preventInitialAnim ? 0 : 0.5,
                ease: "easeInOut",
              }}
              className={`flex flex-wrap items-center gap-4 mt-4 justify-end text-gray-800 ${
                !isScrolled && isHome ? "pointer-events-none" : ""
              }`}
            >
              {/* Home */}
              <Link
                to="/"
                onClick={() => window.scrollTo(0, 0)}
                className={`flex items-end pb-[2px] transition ${
                  isHome ? "text-blue-700" : "text-black hover:text-blue-700"
                }`}
                title="Trang Chủ"
              >
                <Home size={22} strokeWidth={2.2} />
              </Link>

              {user && (
                <Link
                  to="/cart"
                  onClick={() => window.scrollTo(0, 0)}
                  className="relative group hover:text-blue-700 transition flex items-end"
                >
                  <ShoppingCart className="inline-block mr-1" size={20} />
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
                  className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded-md font-medium transition flex items-center"
                >
                  <Lock className="inline-block mr-1" size={18} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}

              {user ? (
                <button
                  onClick={logout}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline ml-2">Đăng Xuất</span>
                </button>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center transition"
                  >
                    <UserPlus className="mr-2" size={18} />
                    Đăng Ký
                  </Link>
                  <Link
                    to="/login"
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition"
                  >
                    <LogIn className="mr-2" size={18} />
                    Đăng Nhập
                  </Link>
                </>
              )}
            </motion.nav>
          </motion.div>
        </div>
      </motion.header>
    </>
  );
};

export default Navbar;