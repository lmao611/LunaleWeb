import { useEffect, useState } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { motion } from "framer-motion";

const CategoryPage = () => {
  const { fetchProductsByCategory, products, loading } = useProductStore();
  const { category } = useParams();

  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 24;

  useEffect(() => {
    const load = async () => {
      await fetchProductsByCategory(category);
      setCurrentPage(1);
      window.scrollTo(0, 0);
    };
    load();
  }, [fetchProductsByCategory, category]);

  const totalCards = products?.length || 0;
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = products?.slice(startIndex, endIndex) || [];

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryTitles = {
    dress: "Đầm Nữ",
    shirt: "Áo Nữ",
    skirt: "Chân Váy",
    set: "Đồ Bộ",
  };
  const displayTitle =
    categoryTitles[category] || category.charAt(0).toUpperCase() + category.slice(1);

  // --- Animation variants ---
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08, // khoảng delay giữa các card
      },
    },
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
    <div className="min-h-screen bg-white text-gray-900 pt-5">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-center text-4xl sm:text-4xl font-bold text-blue-990 mb-10">
          {displayTitle}
        </h1>

        {loading && (
          <h2 className="text-center text-gray-500 text-xl mb-10">Đang tải sản phẩm...</h2>
        )}

        {!loading && totalCards === 0 && (
          <h2 className="text-center text-gray-500 text-xl mb-10">Chưa có sản phẩm</h2>
        )}

        {/* Grid sản phẩm với hiệu ứng */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-25 gap-y-10 justify-items-center mx-auto"
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
              <ProductCard
                product={{
                  ...product,
                  image: product.image || "/placeholder.png",
                }}
                variant="category"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
