import { useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShoppingCart, Tag } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const ProductCard = ({ product, variant = "PeopleAlsoBought", disableLink = false }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);

  const { user } = useUserStore();
  const { addToCart } = useCartStore();

  // ----------------------------------------------------------------
  // 1. XỬ LÝ LOGIC GIỎ HÀNG
  // ----------------------------------------------------------------
  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm giỏ hàng", { id: "login" });
      return;
    }
    addToCart(product);
    toast.success("Đã thêm vào giỏ hàng");
  };

  // ----------------------------------------------------------------
  // 2. XỬ LÝ LOGIC GIÁ & SALE (QUAN TRỌNG)
  // ----------------------------------------------------------------
  const originalPrice = Number(product.price) || 0;
  const percent = Number(product.salePercentage) || 0;
  
  // Kiểm tra điều kiện: Phải có cờ isSale VÀ phần trăm giảm > 0
  // Dùng toán tử so sánh lỏng (== true) hoặc check string để bắt mọi trường hợp từ DB
  const isSale = (product.isSale === true || product.isSale === "true") && percent > 0;

  // Tính giá sau giảm
  const discountedPrice = isSale 
    ? originalPrice * (1 - percent / 100) 
    : originalPrice;

  // Format tiền tệ Việt Nam
  const originalPriceDisplay = originalPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
  const discountedPriceDisplay = discountedPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";

  // ----------------------------------------------------------------
  // 3. XỬ LÝ PRE-ORDER LABEL
  // ----------------------------------------------------------------
  const getPreOrderLabel = (status) => {
    switch (status) {
      case "preorder": return { label: "Pre-Order", color: "bg-purple-500 text-white" };
      case "out": return { label: "Hết hàng", color: "bg-red-500 text-white" };
      case "low": return { label: "Số lượng còn ít", color: "bg-yellow-400 text-gray-900" };
      default: return null;
    }
  };
  const preorderStatus = getPreOrderLabel(product.isPreOrder);

  // ----------------------------------------------------------------
  // 4. HIỆU ỨNG TILT 3D (DESKTOP)
  // ----------------------------------------------------------------
  const handleMouseMove = (e) => {
    if (window.innerWidth < 1024) return;
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * 12;

    card.style.transform = `perspective(800px) scale(1.07) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
    
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    const opacity = Math.min(0.15, Math.hypot(x - centerX, y - centerY) / (rect.width / 1.5));
    glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,${opacity}) 0%, transparent 80%)`;
  };

  const handleMouseLeave = () => {
    if (window.innerWidth < 1024) return;
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;

    card.style.transform = "perspective(800px) scale(1) rotateX(0deg) rotateY(0deg)";
    glare.style.background = "transparent";
  };

  // ----------------------------------------------------------------
  // 5. CẤU HÌNH SIZE RESPONSIVE
  // ----------------------------------------------------------------
  const sizes = {
    category: { width: "w-[160px] sm:w-[200px] lg:w-[260px]", height: "h-[240px] sm:h-[300px] lg:h-[380px]", infoPadding: "p-3", button: "px-3 py-1.5 text-sm" },
    featured: { width: "w-[140px] sm:w-[180px] lg:w-[220px]", height: "h-[140px] sm:h-[180px] lg:h-[220px]", infoPadding: "p-2", button: "px-2 py-1 text-xs" },
    default: { width: "w-[150px] sm:w-[190px] lg:w-[250px]", height: "h-[220px] sm:h-[280px] lg:h-[360px]", infoPadding: "p-3", button: "px-3 py-1.5 text-xs" },
    PeopleAlsoBought: { width: "w-[130px] sm:w-[170px] lg:w-[220px]", height: "h-[200px] sm:h-[260px] lg:h-[320px]", infoPadding: "p-2.5", button: "px-2.5 py-1 text-xs" },
  };
  const size = sizes[variant] || sizes.default;
  const isFeedback = product.category === "feedback";

  // ================================================================
  // A. RENDER GIAO DIỆN FEEDBACK CARD
  // ================================================================
  if (isFeedback) {
    const isInternalLink = product.productLink && product.productLink.includes(window.location.origin);
    
    const FeedbackContent = (
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative overflow-hidden rounded-xl shadow-md transform-gpu will-change-transform
            hover:shadow-2xl transition-transform duration-300 ease-out bg-gray-100
            ${size.width}`}
        >
          <div ref={glareRef} className="pointer-events-none absolute inset-0 rounded-xl z-20 transition-opacity duration-300" />
          
          {/* Badge Container (Feedback cũng cần hiện Sale nếu có) */}
          <div className="absolute top-2 right-2 z-30 flex flex-col items-end gap-1">
             {isSale && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md animate-in fade-in zoom-in">
                   -{percent}%
                </span>
             )}
             {preorderStatus && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md ${preorderStatus.color}`}>
                   {preorderStatus.label}
                </span>
             )}
          </div>

          <div className={`w-full overflow-hidden ${size.height}`}>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => (e.target.src = "https://via.placeholder.com/300x400?text=No+Image")}
            />
          </div>
        </div>
    );

    // Xử lý link nội bộ hoặc link ngoài
    if (isInternalLink) {
        return (
            <Link to={product.productLink.replace(window.location.origin, "")} className="group relative block">
                {FeedbackContent}
            </Link>
        );
    }
    return (
      <a href={product.productLink || "#"} target="_blank" rel="noopener noreferrer" className="group relative block">
        {FeedbackContent}
      </a>
    );
  }

  // ================================================================
  // B. RENDER GIAO DIỆN SẢN PHẨM THƯỜNG (DEFAULT)
  // ================================================================
  const DefaultCardContent = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl shadow-md transform-gpu will-change-transform
        hover:shadow-2xl transition-transform duration-300 ease-out bg-white
        ${size.width}`}
    >
      <div ref={glareRef} className="pointer-events-none absolute inset-0 rounded-xl z-20 transition-opacity duration-300" />

      {/* --- BADGE CONTAINER --- */}
      <div className="absolute top-2 right-2 z-40 flex flex-col items-end gap-1 pointer-events-none">
         {/* Chỉ hiện Badge Sale nếu isSale = true */}
         {isSale && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md animate-in fade-in zoom-in border border-white/20">
               -{percent}%
            </span>
         )}
         {preorderStatus && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md opacity-90 ${preorderStatus.color}`}>
              {preorderStatus.label}
            </span>
         )}
      </div>

      <div className={`w-full overflow-hidden ${size.height}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => (e.target.src = "https://via.placeholder.com/300x400?text=No+Image")}
        />
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0
                    lg:translate-y-full lg:group-hover:translate-y-0
                    transition-transform duration-500 ease-in-out
                    bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent z-30
                    ${size.infoPadding}`}
      >
        <h5 className="font-semibold text-white truncate text-sm mb-1">
          {product.name}
        </h5>
        
        {/* --- HIỂN THỊ GIÁ --- */}
        <div className="mb-2 min-h-[1.5rem] flex items-end">
          {isSale ? (
             // TRƯỜNG HỢP SALE: Hiện giá cũ gạch ngang + giá mới
             <div className="flex flex-col items-start leading-none gap-0.5">
                <div className="flex items-center gap-2">
                   {/* Giá mới màu đỏ nổi bật */}
                   <span className="text-red-400 font-bold text-lg">{discountedPriceDisplay}</span>
                   
                   {/* Giá cũ gạch ngang màu xám */}
                   <span className="text-gray-400 text-[10px] line-through decoration-gray-400 opacity-80">
                      {originalPriceDisplay}
                   </span>
                </div>
             </div>
          ) : (
             // TRƯỜNG HỢP THƯỜNG: Chỉ hiện giá gốc
             <span className="text-white font-bold text-sm">{originalPriceDisplay}</span>
          )}
        </div>

        <button
          className={`flex items-center justify-center w-full rounded-md 
                      bg-white/90 text-gray-950 hover:bg-blue-600 hover:text-white active:scale-95
                      font-medium shadow-sm transition-all
                      ${size.button}`}
          onClick={handleAddToCart}
        >
          <ShoppingCart size={14} className="mr-1.5" /> Thêm giỏ
        </button>
      </div>
    </div>
  );

  if (disableLink) {
    return <div className="group relative block">{DefaultCardContent}</div>;
  }

  return (
    <Link to={`/product/${product._id}`} className="group relative block">
      {DefaultCardContent}
    </Link>
  );
};

export default ProductCard;