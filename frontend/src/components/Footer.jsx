import { Facebook, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (location.pathname === "/") {
      // Nếu đang ở trang home → cuộn lên đầu
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Nếu ở trang khác → điều hướng về home
      navigate("/");
    }
  };

  return (
    <footer className="bg-gradient-to-r from-blue-950 to-blue-900 text-white py-14 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Thông tin liên hệ bên trái */}
        <div className="space-y-3 text-left">
          <h2 className="text-3xl font-bold mb-4">Thông tin liên hệ</h2>
          <p className="text-base opacity-90">Email: example@gmail.com</p>
          <p className="text-base opacity-90">SĐT: 0123 456 789</p>

          <h2 className="text-3xl font-bold mb-4">Các trang mạng xã hội</h2>
          <div className="flex gap-4 mt-4">
            <motion.a
              href="https://www.facebook.com/Lunale.vn"
              whileHover={{ scale: 1.15 }}
              className="p-3 bg-blue-800 rounded-lg transition-colors hover:bg-white group"
            >
              <Facebook
                size={24}
                className="text-white group-hover:text-blue-600 transition"
              />
            </motion.a>
            <motion.a
              href="https://www.instagram.com/lunale.official/"
              whileHover={{ scale: 1.15 }}
              className="p-3 bg-blue-800 rounded-lg transition-colors hover:bg-white group"
            >
              <Instagram
                size={24}
                className="text-white group-hover:text-pink-500 transition"
              />
            </motion.a>
          </div>
        </div>

        {/* Các trang (ở giữa) */}
        <div className="space-y-3 text-left">
          <h2 className="text-3xl font-bold mb-4">Các trang</h2>
          <ul className="space-y-2">
            <li>
              <Link
                to="/category/dress"
                className="hover:text-blue-400 transition-colors text-base"
              >
                Đầm nữ
              </Link>
            </li>
            <li>
              <Link
                to="/category/shirt"
                className="hover:text-blue-400 transition-colors text-base"
              >
                Áo nữ
              </Link>
            </li>
            <li>
              <Link
                to="/category/skirt"
                className="hover:text-blue-400 transition-colors text-base"
              >
                Chân váy
              </Link>
            </li>
            <li>
              <Link
                to="/category/set"
                className="hover:text-blue-400 transition-colors text-base"
              >
                Đồ bộ
              </Link>
            </li>
          </ul>
        </div>

        {/* Logo bên phải → scroll lên đầu nếu đang ở home */}
        <div className="flex justify-start md:justify-end">
          <button
            onClick={handleLogoClick}
            aria-label="Về trang chủ"
            className="focus:outline-none"
          >
            <img
              src="/lunale.png"
              alt="Lunale Logo"
              className="h-40 w-auto filter brightness-0 invert cursor-pointer transition-transform hover:scale-105"
            />
          </button>
        </div>
      </div>

      <div className="mt-10 text-center text-xs text-gray-300 opacity-70">
        © {new Date().getFullYear()} Lunale. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
