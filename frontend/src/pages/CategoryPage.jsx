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

  const filteredProducts = products?.filter((product) => {
    if (product.isHidden) return false;
    const isSale = (product.isSale === true || product.isSale === "true") && (Number(product.salePercentage) > 0);
    return !isSale;
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

  const categoryTitles = {
    dress: "Đầm Nữ",
    shirt: "Áo Nữ",
    skirt: "Chân Váy",
    set: "Đồ Bộ",
    feedback: "Feedback",
  };
  const displayTitle =
    categoryTitles[category] ||
    category.charAt(0).toUpperCase() + category.slice(1);

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
    <div className="min-h-screen bg-white text-gray-900 pt-5">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-25">
        <h1 className="text-4xl font-bold text-blue-990 mb-10 mx-auto text-center">
          {displayTitle}
        </h1>

        {loading && (
          <h2 className="text-center text-gray-500 text-xl mb-10">
            Đang tải sản phẩm...
          </h2>
        )}
        
        {!loading && totalCards === 0 && (
          <h2 className="text-center text-gray-500 text-xl mb-10">
            Chưa có sản phẩm
          </h2>
        )}

        <div className="flex justify-center">
          <motion.div
            className="
              grid
              grid-cols-2
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              gap-x-8 gap-y-10
              justify-items-center
              w-fit
              px-3
              sm:px-4
              md:px-6
              lg:px-0
              mx-auto
              md:max-w-[750px]
              lg:max-w-none
            "
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
                <div className="w-[160px] sm:w-[200px] md:w-[230px] lg:w-[270px]">
                  <ProductCard
                    product={{
                      ...product,
                      image: product.image || "/placeholder.png",
                    }}
                    variant="category"
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
              className="px-3 py-1 rounded-md bg-gray-200 text-black-600 hover:bg-gray-600 disabled:opacity-50"
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
                    : "bg-gray-200 text-black hover:bg-gray-600"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md bg-gray-200 text-black hover:bg-gray-600 disabled:opacity-50"
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