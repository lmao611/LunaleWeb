import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import { useProductionStore } from "../stores/useProductionStore";
import { useUserStore } from "../stores/useUserStore";
import ProductionCard from "../components/ProductionCard";
import { ArrowLeft, Search, Lock, KeyRound } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const categories = [
  { id: "all", label: "Tất cả" },
  { id: "dress", label: "Đầm Nữ" },
  { id: "shirt", label: "Áo Nữ" },
  { id: "skirt", label: "Chân Váy" },
  { id: "set", label: "Đồ Bộ" },
];

const ProductionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchAllProducts, products, loading: productLoading } = useProductStore();
  const { fetchAllProductions, allProductions } = useProductionStore();
  const { logout } = useUserStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 24;

  const [passwordInput, setPasswordInput] = useState("");
  
  // --- BẢO MẬT MỚI: State kiểm tra quyền từ Server ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // GỌI BACKEND ĐỂ KIỂM TRA QUYỀN JWT COOKIE
  useEffect(() => {
    const checkSession = async () => {
      try {
        await axios.get("/production/check-auth");
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchAllProducts();
      fetchAllProductions();
    }
  }, [fetchAllProducts, fetchAllProductions, isAuthorized]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/production/verify-password", { password: passwordInput });
      if (res.data.success) {
        setIsAuthorized(true);
        toast.success("Truy cập thành công");
      }
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error(error.response.data.message);
        setIsAuthorized(false);
        if (logout) {
          await logout();
        }
        navigate("/login");
      } else {
        const left = error.response?.data?.attemptsLeft || 0;
        toast.error(`Sai mật khẩu. Còn ${left} lần thử.`);
        setPasswordInput("");
      }
    }
  };

  const filteredProducts = products?.filter((product) => {
    if (product.category?.toLowerCase() === "feedback") return false;
    if (product.category?.toLowerCase() === "sale") return false;
    if (product.isSale) return false;
    if (selectedCategory !== "all" && product.category?.toLowerCase() !== selectedCategory) return false;
    if (searchTerm && !product.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) || [];

  const totalCards = filteredProducts.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getFinalInventory = (productId) => {
    const prodData = allProductions?.find(p => p.product === productId);
    if (!prodData || !prodData.inventory || prodData.inventory.length === 0) {
      return { total: 0, S: 0, M: 0, L: 0, XL: 0 };
    }
    const lastRow = prodData.inventory[prodData.inventory.length - 1];
    return lastRow.tonCuoiKy || { total: 0, S: 0, M: 0, L: 0, XL: 0 };
  };

  const formatSize = (val) => (val === 0 || !val) ? "-" : val;

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  };

  // Màn hình chờ kiểm tra phiên bảo mật từ server
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-xl font-bold text-gray-500 animate-pulse flex items-center gap-2">
           <Lock size={24}/> Đang xác thực bảo mật...
        </div>
      </div>
    );
  }

  // Màn hình yêu cầu nhập mật khẩu
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-2 border-black">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <Lock className="text-blue-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Khu Vực Sản Xuất</h2>
            <p className="text-gray-500 text-sm mt-2 text-center">Vui lòng nhập mật khẩu bảo mật để truy cập bảng dữ liệu.</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="relative">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                autoFocus
              />
              <KeyRound className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/secret-dashboard")}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors border border-gray-300"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pt-24 pb-12">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/secret-dashboard")}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors font-semibold"
        >
          <ArrowLeft className="mr-2" size={20} />
          Quay lại Admin
        </button>

        <div className="flex flex-col lg:flex-row gap-8 mb-12 items-start">
          <div className="w-full lg:w-1/2 xl:w-7/12 flex flex-col items-center lg:items-start">
            <h1 className="text-4xl font-bold mb-8 text-center lg:text-left uppercase tracking-wider text-black w-full">
              Danh Sách Sản Xuất
            </h1>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-4 mb-8 w-full">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm sm:text-base border ${
                    selectedCategory === cat.id
                      ? "bg-black text-white border-black shadow-md scale-105"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full max-w-xl lg:max-w-full">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm cần sản xuất..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3 pl-12 pr-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
              />
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            </div>
          </div>

          <div className="w-full lg:w-1/2 xl:w-5/12 bg-white border-2 border-black shadow-sm flex flex-col h-[320px]">
            <div className="overflow-auto flex-1">
              <table className="w-full text-center text-xs whitespace-nowrap border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#8FAADC]">
                    <th className="border-b-2 border-r border-black p-2 text-center align-middle w-1/3" rowSpan="2">Sản Phẩm</th>
                    <th className="border-b-2 border-black p-2 text-center" colSpan="5">TỒN CUỐI KỲ</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border-b-2 border-r border-black p-1 text-center w-12">Tổng</th>
                    <th className="border-b-2 border-r border-black p-1 text-center w-10">S</th>
                    <th className="border-b-2 border-r border-black p-1 text-center w-10">M</th>
                    <th className="border-b-2 border-r border-black p-1 text-center w-10">L</th>
                    <th className="border-b-2 border-black p-1 text-center w-10">XL</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const inv = getFinalInventory(p._id);
                    return (
                      <tr key={p._id} className="border-b border-gray-300 hover:bg-gray-50">
                        <td 
                          className="border-r border-black p-2 text-left font-semibold truncate max-w-[150px] cursor-pointer hover:text-blue-600" 
                          title={p.name} 
                          onClick={() => navigate(`/admin/production/${p._id}`, { state: { authorized: true } })}
                        >
                          {p.name}
                        </td>
                        <td className="border-r border-black p-2 text-red-600 font-bold">{formatSize(inv.total)}</td>
                        <td className="border-r border-black p-2">{formatSize(inv.S)}</td>
                        <td className="border-r border-black p-2">{formatSize(inv.M)}</td>
                        <td className="border-r border-black p-2">{formatSize(inv.L)}</td>
                        <td className="p-2">{formatSize(inv.XL)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {productLoading ? (
          <h2 className="text-center text-gray-600 text-xl">Đang tải dữ liệu...</h2>
        ) : totalCards === 0 ? (
          <h2 className="text-center text-gray-600 text-xl">Không tìm thấy sản phẩm nào.</h2>
        ) : (
          <>
            <div className="flex justify-center">
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10 justify-items-center w-fit px-3 sm:px-4 md:px-6 lg:px-0 mx-auto"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                {currentCards.map((product) => (
                  <motion.div
                    key={product._id}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="w-full flex justify-center"
                  >
                    <div 
                      className="w-[160px] sm:w-[200px] lg:w-[260px] flex justify-center cursor-pointer"
                      onClickCapture={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/admin/production/${product._id}`, { state: { authorized: true } });
                      }}
                    >
                      <ProductionCard
                        product={{
                          ...product,
                          image: product.image || "/placeholder.png",
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-gray-200 text-black hover:bg-gray-300 disabled:opacity-50"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === page
                        ? "bg-black text-white"
                        : "bg-gray-200 text-black hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md bg-gray-200 text-black hover:bg-gray-300 disabled:opacity-50"
                >
                  &gt;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductionPage;