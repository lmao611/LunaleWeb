import { Facebook, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SiTiktok, SiShopee } from "react-icons/si";

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  return (
    <footer className="bg-gradient-to-r from-black to-black text-white py-14 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-3 text-left">
          <h2 className="text-3xl font-bold mb-4">Thông tin liên hệ</h2>
          <p className="text-base opacity-90 notranslate">Email: Lunale.concept@gmail.com</p>
          <p className="text-base opacity-90 notranslate">Phone: 0932 341 355</p>

          <h2 className="text-3xl font-bold mb-4">Theo dõi chúng tôi</h2>
          <div className="flex gap-4 mt-4">
            <motion.a
              href="https://www.facebook.com/Lunale.vn"
              whileHover={{ scale: 1.15 }}
              className="p-3 bg-white rounded-lg transition-colors hover:bg-blue-600 group"
            >
              <Facebook
                size={24}
                className="text-black group-hover:text-white transition"
              />
            </motion.a>

            <motion.a
              href="https://www.instagram.com/lunale.official/"
              whileHover={{ scale: 1.15 }}
              className="p-3 rounded-lg transition-all duration-300 bg-white group relative overflow-hidden"
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(to top right, #0070f3, #ec4899, #facc15)",
                }}
              />
              <Instagram
                size={24}
                className="relative z-10 text-black group-hover:text-white transition-colors duration-300"
              />
            </motion.a>

            <motion.a
              href="https://www.tiktok.com/@lunaleofficial?_t=ZS-90gHFx4MrJf&_r=1"
              whileHover={{ scale: 1.15 }}
              className="p-3 rounded-lg bg-white group relative overflow-hidden transition-all duration-300"
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(to top right, #000000, #333333, #ff0050)",
                }}
              />
              <SiTiktok
                size={22}
                className="relative z-10 text-black group-hover:text-white transition-colors duration-300"
              />
            </motion.a>

            <motion.a
              href="https://shopee.vn/lunaleshop"
              whileHover={{ scale: 1.15 }}
              className="p-3 rounded-lg bg-white hover:bg-amber-500 group relative overflow-hidden transition-all duration-300"
            >
              <SiShopee
                size={22}
                className="relative z-10 text-black group-hover:text-white transition-colors duration-300"
              />
            </motion.a>
          </div>
          {/* ✅ Chính sách quyền riêng tư */}
<div className="mt-10 text-left">
  <h2 className="text-3xl font-bold mb-4">Chính sách quyền riêng tư</h2>
  <ul className="space-y-2">
    <li>
      <Link
        to="/privacy#introduction"
        className="hover:text-blue-400 transition-colors text-base"
      >
        Giới thiệu
      </Link>
    </li>
    <li>
      <Link
        to="/privacy#collect"
        className="hover:text-blue-400 transition-colors text-base"
      >
        Thu thập thông tin
      </Link>
    </li>
    <li>
      <Link
        to="/privacy#usage"
        className="hover:text-blue-400 transition-colors text-base"
      >
        Cách sử dụng thông tin
      </Link>
    </li>
    <li>
      <Link
        to="/privacy#protection"
        className="hover:text-blue-400 transition-colors text-base"
      >
        Bảo mật dữ liệu
      </Link>
    </li>
    <li>
      <Link
        to="/privacy#rights"
        className="hover:text-blue-400 transition-colors text-base"
      >
        Quyền của người dùng
      </Link>
    </li>
  </ul>
</div>

        </div>
        
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

          <h2 className="text-3xl font-bold mt-8 mb-4">Chính sách</h2>
          <ul className="space-y-2">
            <li>
              <Link
                to="/policy#exchange"
                className="hover:text-blue-400 transition-colors text-base"
              >
                Chính sách đổi hàng
              </Link>
            </li>
            <li>
              <Link
                to="/policy#inspection"
                className="hover:text-blue-400 transition-colors text-base"
              >
                Chính sách kiểm hàng
              </Link>
            </li>
            <li>
              <Link
                to="/policy#payment"
                className="hover:text-blue-400 transition-colors text-base"
              >
                Chính sách thanh toán
              </Link>
            </li>
            <li>
              <Link
                to="/policy#shipping"
                className="hover:text-blue-400 transition-colors text-base"
              >
                Chính sách vận chuyển
              </Link>
            </li>
            
          </ul>
        </div>

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
