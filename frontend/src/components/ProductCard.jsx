import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { optimizeUrl } from "../lib/cloudinary";
import AddToCartModal from "./AddToCartModal";

const ProductCard = ({ product, variant = "PeopleAlsoBought", disableLink = false }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const { user } = useUserStore();
  
  const [showModal, setShowModal] = useState(false);
  
  const PLACEHOLDER_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    if (!user) return toast.error("Vui lòng đăng nhập", { id: "login" });
    setShowModal(true);
  };

  const originalPrice = Number(product.price) || 0;
  const percent = Number(product.salePercentage) || 0;
  const isSale = (product.isSale === true || product.isSale === "true" || product.isSale === 1) && percent > 0;
  const discountedPrice = isSale ? originalPrice * (1 - percent / 100) : originalPrice;

  const originalDisplay = originalPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
  const discountedDisplay = discountedPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";

  const getStatusBadge = (status) => {
    switch (status) {
      case "preorder": 
        return { label: "Pre-Order", color: "bg-gray-950 text-white" };
      case "out": 
        return { label: "Sold Out", color: "bg-red-500 text-white" };
      case "low": 
        return { label: "Low Stock", color: "bg-yellow-400 text-gray-900" };
      default: 
        return null; 
    }
  };
  
  const statusInfo = getStatusBadge(product.isPreOrder);

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

  // ĐÃ SỬA: Ép size mobile gọn hơn nữa (py-1.5 cho padding, py-1 cho button)
  const sizes = {
    category: { width: "w-[160px] sm:w-[200px] lg:w-[260px]", height: "h-[240px] sm:h-[300px] lg:h-[380px]", infoPadding: "px-2 py-1.5 sm:p-3", button: "px-3 py-1 sm:py-1.5 text-sm" },
    featured: { width: "w-[140px] sm:w-[180px] lg:w-[220px]", height: "h-[140px] sm:h-[180px] lg:h-[220px]", infoPadding: "px-1.5 py-1 sm:p-2", button: "px-2 py-1 text-xs" },
    default: { width: "w-[150px] sm:w-[190px] lg:w-[250px]", height: "h-[220px] sm:h-[280px] lg:h-[360px]", infoPadding: "px-2 py-1.5 sm:p-3", button: "px-3 py-1 sm:py-1.5 text-xs" },
    PeopleAlsoBought: { width: "w-[130px] sm:w-[170px] lg:w-[220px]", height: "h-[200px] sm:h-[260px] lg:h-[320px]", infoPadding: "px-1.5 py-1.5 sm:p-2.5", button: "px-2.5 py-1 text-xs" },
  };
  const size = sizes[variant] || sizes.default;
  const isFeedback = product.category === "feedback";

  const CardContent = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl shadow-md transform-gpu will-change-transform
        hover:shadow-2xl transition-transform duration-300 ease-out bg-white
        ${size.width}`}
    >
      <div ref={glareRef} className="pointer-events-none absolute inset-0 rounded-xl z-20 transition-opacity duration-300" />

      <div className="absolute top-2 right-2 z-40 flex flex-col items-end gap-1 pointer-events-none">
         {isSale && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md">
                -{percent}%
            </span>
         )}
         
         {statusInfo && (
            <span className={`${statusInfo.color} text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md opacity-90`}>
              {statusInfo.label}
            </span>
         )}
      </div>

      <div className={`w-full overflow-hidden ${size.height}`}>
        <img
          src={product.image ? optimizeUrl(product.image, 400) : PLACEHOLDER_IMAGE}
          alt={product.name}
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 select-none"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}
        />
      </div>

      {!isFeedback && (
        <div className={`absolute bottom-0 left-0 right-0 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-500 ease-in-out bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent z-30 ${size.infoPadding}`}>
          {/* ĐÃ SỬA: mb-0 (xóa hẳn margin dưới tên) */}
          <h5 className="font-semibold text-white truncate text-[10.5px] sm:text-sm mb-0 sm:mb-0.5 leading-tight">{product.name}</h5>
          
          {/* ĐÃ SỬA: mb-0.5 và min-h-0 để không chiếm chỗ trống vô lý */}
          <div className="mb-0.5 sm:mb-1 min-h-0 sm:min-h-[1.5rem] flex items-end">
            {isSale ? (
               <div className="flex items-center gap-2">
                  <span className="text-red-400 font-bold text-lg">{discountedDisplay}</span>
                  <span className="text-gray-300 text-[10px] line-through decoration-gray-400 opacity-80">{originalDisplay}</span>
               </div>
            ) : (
               <span className="text-white font-bold text-sm">{originalDisplay}</span>
            )}
          </div>

          <button className={`flex items-center justify-center w-full rounded-md bg-white/90 text-gray-950 hover:bg-gray-950 hover:text-white active:scale-95 font-medium shadow-sm transition-all ${size.button}`} 
            onClick={handleAddToCartClick}
          >
            <ShoppingCart size={14} className="mr-1.5" /> Thêm
          </button>
        </div>
      )}
    </div>
  );

  if (isFeedback) {
     const isInternal = product.productLink && product.productLink.includes(window.location.origin);
     if (isInternal) {
        return <Link to={product.productLink.replace(window.location.origin, "")} className="group relative block">{CardContent}</Link>;
     }
     return <a href={product.productLink || "#"} target="_blank" rel="noopener noreferrer" className="group relative block">{CardContent}</a>;
  }

  if (disableLink) return <div className="group relative block">{CardContent}</div>;

  return (
    <>
      <Link to={`/product/${product._id}`} className="group relative block">{CardContent}</Link>
      {showModal && <AddToCartModal product={product} onClose={() => setShowModal(false)} />}
    </>
  );
};

export default ProductCard;