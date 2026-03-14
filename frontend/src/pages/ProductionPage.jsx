import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import ProductionCard from "../components/ProductionCard";
import { ArrowLeft, Search } from "lucide-react";

const categories = [
  { id: "all", label: "Tất cả" },
  { id: "dress", label: "Đầm Nữ" },
  { id: "shirt", label: "Áo Nữ" },
  { id: "skirt", label: "Chân Váy" },
  { id: "set", label: "Đồ Bộ" },
];

const ProductionPage = () => {
  const navigate = useNavigate();
  const { fetchAllProducts, products, loading } = useProductStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 24;

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Reset page về 1 khi đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Lọc sản phẩm
  const filteredProducts = products?.filter((product) => {
    // 1. Loại bỏ Feedback
    if (product.category?.toLowerCase() === "feedback") return false;
    
    // 2. Lọc theo Category
    if (selectedCategory !== "all" && product.category?.toLowerCase() !== selectedCategory) {
      return false;
    }

    // 3. Lọc theo từ khóa tìm kiếm
    if (searchTerm && !product.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  }) || [];

  // Logic phân trang
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

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pt-24 pb-12">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/secret-dashboard")}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors font-semibold"
        >
          <ArrowLeft className="mr-2" size={20} />
          Quay lại Admin
        </button>

        <h1 className="text-4xl font-bold mb-8 text-center uppercase tracking-wider text-black">
          Danh Sách Sản Xuất
        </h1>

        {/* Tab Phân loại Category */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
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

        {/* Thanh tìm kiếm */}
        <div className="relative max-w-xl mx-auto mb-12">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm cần sản xuất..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
          />
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        </div>

        {loading ? (
          <h2 className="text-center text-gray-600 text-xl">Đang tải dữ liệu...</h2>
        ) : totalCards === 0 ? (
          <h2 className="text-center text-gray-600 text-xl">Không tìm thấy sản phẩm nào.</h2>
        ) : (
          <>
            <div className="flex justify-center">
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 justify-items-center w-full md:max-w-[750px] lg:max-w-none"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                {currentCards.map((product) => (
                  <motion.div
                    key={product._id}
                    variants={cardVariants}
                    className="w-[160px] sm:w-[200px] md:w-[230px] lg:w-[270px] flex justify-center"
                  >
                    <ProductionCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Phân trang (Pagination) */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-gray-200 text-black hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded-md transition-colors ${
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
                  className="px-3 py-1 rounded-md bg-gray-200 text-black hover:bg-gray-300 disabled:opacity-50 transition-colors"
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