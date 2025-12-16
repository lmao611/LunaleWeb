import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore"; // ✅ Import UserStore
import toast from "react-hot-toast"; // ✅ Import Toast
import AddToCartModal from "./AddToCartModal"; // ✅ Import Modal

const FeaturedProducts = () => {
  const { products, fetchFeaturedProducts } = useProductStore();
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width < 640) setItemsPerPage(2);
      else if (width < 900) setItemsPerPage(3);
      else setItemsPerPage(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setPage((p) => Math.max(p - 1, 0));

  if (!products?.length)
    return (
      <div className="text-center text-gray-500 py-20">
        Không có sản phẩm nổi bật.
      </div>
    );

  const start = page * itemsPerPage;
  const visibleProducts = products.slice(start, start + itemsPerPage);

  const getPreOrderLabel = (status) => {
    switch (status) {
      case "preorder": return { label: "Pre-Order", color: "bg-purple-500 text-white" };
      case "out": return { label: "Hết hàng", color: "bg-red-500 text-white" };
      case "low": return { label: "Số lượng còn ít", color: "bg-yellow-400 text-gray-900" };
      default: return null;
    }
  };

  return (
    <div className="py-12 bg-transparent relative overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-center sm:text-3xl font-bold text-blue-990 mb-6">
          Sản phẩm được ưa thích
        </h2>

        <div className="relative z-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
            {visibleProducts.map((product) => (
              <Card
                key={product._id}
                product={product}
                isMobile={isMobile}
                preorderStatus={getPreOrderLabel(product.isPreOrder)}
              />
            ))}
          </div>

          <div className="z-50">
            <button onClick={prevPage} disabled={page === 0} className={`absolute top-1/2 -left-4 transform -translate-y-1/2 flex items-center justify-center rounded-full transition-colors duration-300 shadow-md ${page === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-700"} ${isMobile ? "w-8 h-8 p-1" : "w-10 h-10 p-2"} z-50`}>
              <ChevronLeft className={`${isMobile ? "w-4 h-4" : "w-6 h-6"} text-white`} />
            </button>
            <button onClick={nextPage} disabled={page >= totalPages - 1} className={`absolute top-1/2 -right-4 transform -translate-y-1/2 flex items-center justify-center rounded-full transition-colors duration-300 shadow-md ${page >= totalPages - 1 ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-700"} ${isMobile ? "w-8 h-8 p-1" : "w-10 h-10 p-2"} z-50`}>
              <ChevronRight className={`${isMobile ? "w-4 h-4" : "w-6 h-6"} text-white`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// === CARD Component ===
const Card = ({ product, isMobile, preorderStatus }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const { user } = useUserStore(); // ✅ Lấy user info
  const [showModal, setShowModal] = useState(false); // ✅ State Popup

  // Hàm xử lý khi bấm nút Add
  const handleAddToCartClick = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); // Ngăn chặn nhảy link
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng", { id: "login" });
      return;
    }
    setShowModal(true); // ✅ Mở Modal
  };

  const handleMouseMove = (e) => {
    if (isMobile) return;
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;
    card.style.transform = `perspective(800px) scale(1.05) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    const opacity = Math.min(0.25, Math.hypot(x - centerX, y - centerY) / (rect.width / 1.5));
    glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,${opacity}) 0%, transparent 80%)`;
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;
    card.style.transform = "perspective(800px) scale(1) rotateX(0deg) rotateY(0deg)";
    glare.style.background = "transparent";
  };

  return (
    <>
      <motion.div whileHover={!isMobile ? { scale: 1.04 } : {}} transition={{ duration: 0.3 }} className="z-10">
        <Link
          to={`/product/${product._id}`}
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="group relative block overflow-hidden rounded-xl shadow-md hover:shadow-1xl hover:ring-2 hover:ring-gray-900/40 transition-transform duration-200 ease-out bg-white/80 backdrop-blur-sm w-40 sm:w-52 md:w-54 md:h-72 lg:w-64 lg:h-77"
        >
          <div ref={glareRef} className="pointer-events-none absolute inset-0 rounded-xl z-20 transition-all duration-300" />

          {preorderStatus && (
            <span className={`absolute top-2 right-2 z-30 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md opacity-70 ${preorderStatus.color}`}>
              {preorderStatus.label}
            </span>
          )}

          <div className="h-60 sm:h-72 md:h-80 lg:h-96 w-full overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => (e.target.src = "https://via.placeholder.com/300x400?text=No+Image")}
            />
          </div>

          <div className={`absolute bottom-0 left-0 right-0 z-30 p-2 bg-gradient-to-t from-gray-900/80 to-gray-600/40 transition-transform duration-500 ease-in-out ${isMobile ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"}`}>
            <h5 className="font-semibold text-white truncate text-sm sm:text-base">{product.name}</h5>
            <div className="flex items-center justify-between mt-1">
              <span className="text-white font-bold text-sm">{Number(product.price).toLocaleString("vi-VN")}đ</span>
            </div>

            <button
              className="mt-2 flex items-center justify-center w-full rounded-md bg-gray-200 text-black hover:bg-gray-700 hover:text-white active:scale-95 px-3 py-1.5 text-xs"
              onClick={handleAddToCartClick} // ✅ GỌI HÀM MỚI
            >
              <ShoppingCart size={14} className="mr-1" />
              Add
            </button>
          </div>
        </Link>
      </motion.div>

      {/* ✅ MODAL POPUP */}
      {showModal && <AddToCartModal product={product} onClose={() => setShowModal(false)} />}
    </>
  );
};

export default FeaturedProducts;