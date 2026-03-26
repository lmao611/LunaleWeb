import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";
import AddToCartModal from "./AddToCartModal";

const FeaturedProducts = () => {
  const { products, fetchFeaturedProducts } = useProductStore();
  const [isMobile, setIsMobile] = useState(false);

  // --- STATE VÀ REF CHO TÍNH NĂNG AUTO-SLIDE MƯỢT MÀ ---
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const scrollContainerRef = useRef(null);
  const reqRef = useRef(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- LOGIC TRƯỢT TỪ TỪ (SMOOTH SCROLL) ---
  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollStep = () => {
      if (!container) return;
      
      // Tốc độ trượt (Pixel trên mỗi khung hình). Tăng số này lên nếu muốn trượt nhanh hơn (vd: 1.5)
      container.scrollLeft += 0.8; 

      // Hiệu ứng vòng lặp vô tận: Khi cuộn được đúng 1 nửa (bằng chiều dài ds gốc), giật mượt mà về 0
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      }

      reqRef.current = requestAnimationFrame(scrollStep);
    };
    
    reqRef.current = requestAnimationFrame(scrollStep);

    return () => cancelAnimationFrame(reqRef.current);
  }, [isAutoPlaying, products.length]);

  // Hàm dừng tự động trượt
  const stopAutoPlay = () => {
    if (isAutoPlaying) setIsAutoPlaying(false);
  };

  // Hàm cho 2 nút bấm trên máy tính
  const handleScrollLeftBtn = () => {
    stopAutoPlay();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -scrollContainerRef.current.clientWidth * 0.8, behavior: "smooth" });
    }
  };

  const handleScrollRightBtn = () => {
    stopAutoPlay();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: scrollContainerRef.current.clientWidth * 0.8, behavior: "smooth" });
    }
  };

  if (!products?.length)
    return (
      <div className="text-center text-gray-500 py-20">
        Không có sản phẩm nổi bật.
      </div>
    );

  const getPreOrderLabel = (status) => {
    switch (status) {
      case "preorder": return { label: "Pre-Order", color: "bg-purple-500 text-white" };
      case "out": return { label: "Hết hàng", color: "bg-red-500 text-white" };
      case "low": return { label: "Số lượng còn ít", color: "bg-yellow-400 text-gray-900" };
      default: return null;
    }
  };

  // Nhân đôi mảng sản phẩm để có thể trượt mượt mà không bị khựng lại ở cuối
  const displayProducts = [...products, ...products];

  return (
    <div className="py-12 bg-transparent relative overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <h2 className="text-center text-3xl mb:text-[26px] font-bold text-blue-990 mb-6">
          Featured Products
        </h2>

        <div className="relative z-0 group">
          {/* Băng chuyền chung cho cả Desktop và Mobile */}
          <div 
            ref={scrollContainerRef}
            onTouchStart={stopAutoPlay} // Tắt auto khi vuốt trên điện thoại
            onMouseDownCapture={stopAutoPlay} // Tắt auto khi click/kéo trên máy tính
            onWheel={stopAutoPlay} // Tắt auto khi lăn chuột
            className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {displayProducts.map((product, index) => (
              <Card
                key={`${product._id}-${index}`}
                product={product}
                isMobile={isMobile}
                preorderStatus={getPreOrderLabel(product.isPreOrder)}
              />
            ))}
          </div>

          {/* Chỉ hiển thị nút điều hướng trên máy tính */}
          {!isMobile && (
            <div className="z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button onClick={handleScrollLeftBtn} className="absolute top-1/2 -left-4 transform -translate-y-1/2 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-700 transition-colors duration-300 shadow-md w-10 h-10 p-2 z-50">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button onClick={handleScrollRightBtn} className="absolute top-1/2 -right-4 transform -translate-y-1/2 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-700 transition-colors duration-300 shadow-md w-10 h-10 p-2 z-50">
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Card = ({ product, isMobile, preorderStatus }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const { user } = useUserStore();
  const [showModal, setShowModal] = useState(false);

  const handleAddToCartClick = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng", { id: "login" });
      return;
    }
    setShowModal(true);
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
      <motion.div 
        whileHover={!isMobile ? { scale: 1.04 } : {}} 
        transition={{ duration: 0.3 }} 
        className="z-10 shrink-0 w-[160px] sm:w-[200px] md:w-[240px] lg:w-[260px]"
      >
        <Link
          to={`/product/${product._id}`}
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="group relative block overflow-hidden rounded-xl shadow-md hover:shadow-xl hover:ring-2 hover:ring-gray-900/40 transition-transform duration-200 ease-out bg-white/80 backdrop-blur-sm w-full h-full"
        >
          <div ref={glareRef} className="pointer-events-none absolute inset-0 rounded-xl z-20 transition-all duration-300" />

          {preorderStatus && (
            <span className={`absolute top-2 right-2 z-30 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md opacity-70 ${preorderStatus.color}`}>
              {preorderStatus.label}
            </span>
          )}

          <div className="h-52 sm:h-72 md:h-80 lg:h-96 w-full overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
              style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 select-none"
              onError={(e) => (e.target.src = "https://via.placeholder.com/300x400?text=No+Image")}
            />
          </div>

          <div className={`absolute bottom-0 left-0 right-0 z-30 p-2 bg-gradient-to-t from-gray-900/80 to-gray-600/40 transition-transform duration-500 ease-in-out ${isMobile ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"}`}>
            <h5 className="font-semibold text-white truncate text-[10.5px] sm:text-base">{product.name}</h5>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">{Number(product.price).toLocaleString("vi-VN")}đ</span>
            </div>

            <button
              className="mt-2 flex items-center justify-center w-full rounded-md bg-white text-gray-950 hover:bg-gray-950 hover:text-white active:scale-95 px-3 py-1.5 text-xs"
              onClick={handleAddToCartClick}
            >
              <ShoppingCart size={14} className="mr-1" />
              Thêm
            </button>
          </div>
        </Link>
      </motion.div>

      {showModal && <AddToCartModal product={product} onClose={() => setShowModal(false)} />}
    </>
  );
};

export default FeaturedProducts;