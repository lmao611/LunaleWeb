import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { useCollectionStore } from "../stores/useCollectionStore";
import LoadingSpinner from "../components/LoadingSpinner";

const CollectionDetailPage = () => {
  const { id } = useParams();
  const { collections, fetchCollectionDetail } = useCollectionStore();
  
  // 1. LẤY NGAY DỮ LIỆU VỎ (Tên, Ảnh...) TỪ STORE
  // Vì Home Page đã tải danh sách rồi, nên thông tin này có sẵn ngay lập tức.
  const collection = collections.find((c) => c._id === id);

  // 2. KIỂM TRA: Đã có danh sách sản phẩm (products) bên trong chưa?
  // Lúc ở Home, 'products' chưa được fetch. Khi vào đây mới fetch.
  const hasProducts = collection && Array.isArray(collection.products) && collection.products.length > 0;
  
  // State loading cục bộ: Chỉ true nếu chưa có sản phẩm
  const [loadingProducts, setLoadingProducts] = useState(!hasProducts);
  
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 24;

  useEffect(() => {
    const loadDetail = async () => {
      // ✅ CHỈ GỌI API NẾU CHƯA CÓ SẢN PHẨM (Cache hit)
      // Nếu hasProducts = true (đã fetch rồi), dòng này sẽ bị bỏ qua -> Không load lại -> Siêu nhanh
      if (!hasProducts) {
        setLoadingProducts(true);
        await fetchCollectionDetail(id);
        setLoadingProducts(false);
      }
    };
    loadDetail();
    // Scroll lên đầu trang khi vào
    window.scrollTo(0, 0);
  }, [id, hasProducts, fetchCollectionDetail]);

  // Nếu không tìm thấy collection nào (cả trong cache lẫn sau khi fetch)
  if (!collection && !loadingProducts)
    return <div className="text-center py-20 text-gray-500">Không tìm thấy bộ sưu tập.</div>;

  // --- Logic Phân trang (Pagination) ---
  const products = collection?.products || [];
  const totalCards = products.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  const start = (currentPage - 1) * cardsPerPage;
  const currentCards = products.slice(start, start + cardsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const containerVariants = { visible: { transition: { staggerChildren: 0.05 } } };
  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-5">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* ✅ HEADER: HIỆN NGAY LẬP TỨC (Không chờ fetch products) */}
        {/* Vì lấy từ biến 'collection' có sẵn trong store nên nó hiện ra tức thì */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-extrabold tracking-tight inline-block max-w-[800px] break-words"
            style={{
              backgroundImage: `linear-gradient(to right, ${collection?.gradientFrom || "#3b82f6"}, ${collection?.gradientTo || "#06b6d4"})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {collection?.name || "Đang tải..."}
          </h1>
          <hr className="w-24 mx-auto border-t-4 border-blue-600 mb-6 rounded-full opacity-80 mt-4" />
        </div>

        {/* ✅ BODY: CHỈ HIỆN SPINNER Ở KHU VỰC SẢN PHẨM */}
        {loadingProducts ? (
           <div className="flex justify-center items-center h-60">
              <LoadingSpinner />
           </div>
        ) : currentCards.length > 0 ? (
          <div className="flex justify-center">
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10 w-fit mx-auto"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {currentCards.map((product) => (
                <motion.div key={product._id} variants={cardVariants} className="flex justify-center">
                  <div className="w-[160px] sm:w-[200px] md:w-[230px] lg:w-[270px]">
                    <ProductCard
                      // Tối ưu ảnh (nếu ProductCard chưa có optimizeUrl thì thêm vào)
                      product={{ ...product, image: product.image || "/placeholder.png" }}
                      variant="category"
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          <p className="text-center text-gray-500 italic">
            Bộ sưu tập này chưa có sản phẩm nào.
          </p>
        )}

        {/* Phân trang */}
        {!loadingProducts && totalPages > 1 && (
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