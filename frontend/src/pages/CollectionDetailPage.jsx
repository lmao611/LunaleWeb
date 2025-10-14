import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { useCollectionStore } from "../stores/useCollectionStore";

const CollectionDetailPage = () => {
  const { id } = useParams();
  const { collections, fetchCollections, isLoading } = useCollectionStore();

  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 24;

  useEffect(() => {
    if (!collections || collections.length === 0) {
      fetchCollections();
    } else {
      window.scrollTo(0, 0);
    }
  }, [fetchCollections, collections]);

  const collection = collections.find((c) => c._id === id);

  if (isLoading)
    return (
      <div className="text-center py-20 text-gray-600">
        Đang tải bộ sưu tầm...
      </div>
    );

  if (!collection)
    return (
      <div className="text-center py-20 text-gray-600">
        Không tìm thấy bộ sưu tầm
      </div>
    );

  // --- Pagination logic ---
  const totalCards = collection.products?.length || 0;
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = collection.products?.slice(startIndex, endIndex) || [];

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Animation variants ---
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
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* --- Tiêu đề --- */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-extrabold tracking-tight leading-tight inline-block max-w-[600px] break-words"
            style={{
              backgroundImage: `linear-gradient(to right, ${
                collection.gradientFrom || "#3b82f6"
              }, ${collection.gradientTo || "#06b6d4"})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {collection.name}
          </h1>

          <hr className="w-24 mx-auto border-t-4 border-blue-600 mb-6 rounded-full opacity-80" />

          
        </div>

        {/* --- Grid sản phẩm --- */}
        {currentCards.length > 0 ? (
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
        ) : (
          <p className="text-center text-gray-500 italic">
            Bộ sưu tầm này chưa có sản phẩm nào.
          </p>
        )}

        {/* --- Pagination --- */}
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

        {/* --- Nút quay lại --- */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-block text-black hover:text-gray-700 font-semibold transition-colors duration-200"
          >
            ← Quay về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailPage;
