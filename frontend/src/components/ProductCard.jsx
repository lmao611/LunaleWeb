import { useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const ProductCard = ({ product, variant = "PeopleAlsoBought", disableLink = false }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);

  const { user } = useUserStore();
  const { addToCart } = useCartStore();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm giỏ hàng", { id: "login" });
      return;
    }
    addToCart(product);
    toast.success("Đã thêm vào giỏ hàng");
  };

  // -------------------------------------------------------------------
  // ✅ FIX LOGIC SALE: Ép kiểu dữ liệu để tránh lỗi so sánh string/number
  // -------------------------------------------------------------------
  const originalPrice = Number(product.price) || 0;
  const percent = Number(product.salePercentage) || 0;
  
  // Kiểm tra sale: Có cờ isSale VÀ phần trăm giảm > 0
  // Dùng Boolean() để bắt trường hợp isSale là "true" (string) hoặc 1 (number)
  const isSale = Boolean(product.isSale) && percent > 0;

  const discountedPrice = isSale 
    ? originalPrice * (1 - percent / 100) 
    : originalPrice;

  const originalPriceDisplay = originalPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
  const discountedPriceDisplay = discountedPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";

  // Pre-order logic
  const getPreOrderLabel = (status) => {
    switch (status) {
      case "preorder": return { label: "Pre-Order", color: "bg-purple-500 text-white" };
      case "out": return { label: "Hết hàng", color: "bg-red-500 text-white" };
      case "low": return { label: "Số lượng còn ít", color: "bg-yellow-400 text-gray-900" };
      default: return null;
    }
  };
  const preorderStatus = getPreOrderLabel(product.isPreOrder);

  // Tilt Effect Logic (Desktop)
  const handleMouseMove = (e) => {
    if (window.innerWidth < 1024) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * 12;
    card.style.transform = `perspective(800px) scale(1.07) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (window.innerWidth < 1024) return;
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) scale(1) rotateX(0deg) rotateY(0deg)";
  };

  // Responsive sizes
  const sizes = {
    category: { width: "w-[160px] sm:w-[200px] lg:w-[260px]", height: "h-[240px] sm:h-[300px] lg:h-[380px]", infoPadding: "p-3", button: "px-3 py-1.5 text-sm" },
    featured: { width: "w-[140px] sm:w-[180px] lg:w-[220px]", height: "h-[140px] sm:h-[180px] lg:h-[220px]", infoPadding: "p-2", button: "px-2 py-1 text-xs" },
    default: { width: "w-[150px] sm:w-[190px] lg:w-[250px]", height: "h-[220px] sm:h-[280px] lg:h-[360px]", infoPadding: "p-3", button: "px-3 py-1.5 text-xs" },
    PeopleAlsoBought: { width: "w-[130px] sm:w-[170px] lg:w-[220px]", height: "h-[200px] sm:h-[260px] lg:h-[320px]", infoPadding: "p-2.5", button: "px-2.5 py-1 text-xs" },
  };
  const size = sizes[variant] || sizes.default;
  const isFeedback = product.category === "feedback";

  // --- RENDER CONTENT ---
  const CardContent = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl shadow-md transform-gpu will-change-transform
        hover:shadow-2xl transition-transform duration-300 ease-out bg-gray-100
        ${size.width}`}
    >
      <div ref={glareRef} className="pointer-events-none absolute inset-0 rounded-xl z-20" />

      {/* --- BADGES CONTAINER (SALE + PREORDER) --- */}
      <div className="absolute top-2 right-2 z-40 flex flex-col items-end gap-1 pointer-events-none">
         {/* ✅ Badge Sale: Luôn hiện nếu isSale = true */}
         {isSale && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md animate-in fade-in zoom-in border border-white/20">
               -{percent}%
            </span>
         )}
         {preorderStatus && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md ${preorderStatus.color}`}>
              {preorderStatus.label}
            </span>
         )}
      </div>

      {/* Image */}
      <div className={`w-full overflow-hidden ${size.height}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => (e.target.src = "https://via.placeholder.com/300x400?text=No+Image")}
        />
      </div>

      {/* Info Section (Chỉ hiện cho Non-Feedback) */}
      {!isFeedback && (
        <div className={`absolute bottom-0 left-0 right-0 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-500 ease-in-out bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent z-30 ${size.infoPadding}`}>
          <h5 className="font-semibold text-white truncate text-sm mb-1">{product.name}</h5>
          
          {/* ✅ GIÁ TIỀN: LOGIC HIỂN THỊ SALE */}
          <div className="mb-2 min-h-[1.5rem] flex items-end">
            {isSale ? (
               <div className="flex flex-col items-start leading-none gap-0.5">
                  <div className="flex items-center gap-2">
                     <span className="text-red-400 font-bold text-lg">{discountedPriceDisplay}</span>
                     <span className="text-gray-400 text-[10px] line-through decoration-gray-400 opacity-80">{originalPriceDisplay}</span>
                  </div>
               </div>
            ) : (
               <span className="text-white font-bold text-sm">{originalPriceDisplay}</span>
            )}
          </div>

          <button className={`flex items-center justify-center w-full rounded-md bg-white/90 text-gray-950 hover:bg-blue-600 hover:text-white active:scale-95 font-medium shadow-sm transition-all ${size.button}`} onClick={handleAddToCart}>
            <ShoppingCart size={14} className="mr-1.5" /> Thêm giỏ
          </button>
        </div>
      )}
    </div>
  );

  // Wrapper Link
  if (isFeedback) {
     const isInternal = product.productLink && product.productLink.includes(window.location.origin);
     if (isInternal) return <Link to={product.productLink.replace(window.location.origin, "")} className="group relative block">{CardContent}</Link>;
     return <a href={product.productLink || "#"} target="_blank" rel="noopener noreferrer" className="group relative block">{CardContent}</a>;
  }

  if (disableLink) return <div className="group relative block">{CardContent}</div>;
  return <Link to={`/product/${product._id}`} className="group relative block">{CardContent}</Link>;
};

export default ProductCard;