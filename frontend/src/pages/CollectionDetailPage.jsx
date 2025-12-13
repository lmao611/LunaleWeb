import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { useCollectionStore } from "../stores/useCollectionStore";
import LoadingSpinner from "../components/LoadingSpinner";

const CollectionDetailPage = () => {
  const { id } = useParams();
  const { collections, fetchCollectionDetail } = useCollectionStore();
  
  // Tìm collection trong Store
  const collection = collections.find((c) => c._id === id);

  // Check cache: Đã có sản phẩm chưa?
  const isCached = collection && Array.isArray(collection.products) && collection.products.length > 0;
  
  // State loading
  const [loading, setLoading] = useState(!isCached);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 24;

  useEffect(() => {
    const loadData = async () => {
      if (!isCached) {
        setLoading(true);
        await fetchCollectionDetail(id);
        setLoading(false);
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, [id, isCached, fetchCollectionDetail]);

  // --- 1. KHAI BÁO BIẾN ANIMATION (Bị thiếu ở code cũ) ---
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

  // --- 2. XỬ LÝ HIỂN THỊ ---
  // Nếu chưa có collection (và đang không load) -> Báo lỗi
  if (!collection && !loading) 
    return (
      <div className="text-center py-20 text-gray-600">
        Không tìm thấy bộ sưu tầm
      </div>
    );

  // Pagination Logic
  const products = collection?.products || [];
  const totalCards = products.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = products.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-5">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* HEADER: Hiện ngay lập tức vì data đã có từ Home */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-extrabold tracking-tight leading-tight inline-block max-w-[600px] break-words"
            style={{
              backgroundImage: `linear-gradient(to right, ${
                collection?.gradientFrom || "#3b82f6"
              }, ${collection?.gradientTo || "#06b6d4"})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {collection?.name || "Đang tải..."}
          </h1>
          <hr className="w-24 mx-auto border-t-4 border-blue-600 mb-6 rounded-full opacity-80" />
        </div>

        {/* BODY: Loading Spinner hoặc Grid Sản Phẩm */}
        {loading ? (
           <div className="flex justify-center items-center h-40">
              <LoadingSpinner />
           </div>
        ) : currentCards.length > 0 ? (
          <div className="flex justify-center">
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10 justify-items-center w-fit px-3 sm:px-4 md:px-6 lg:px-0 mx-auto md:max-w-[750px] lg:max-w-none"
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

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50">&lt;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => goToPage(page)} className={`px-3 py-1 rounded-md ${currentPage === page ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}`}>{page}</button>
                ))}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50">&gt;</button>
            </div>
        )}

        <div className="text-center mt-12">
          <Link to="/" className="inline-block text-black hover:text-gray-700 font-semibold transition-colors duration-200">
            ← Quay về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailPage;