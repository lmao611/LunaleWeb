import { useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { optimizeUrl } from "../lib/cloudinary"; // ✅ Import hàm tối ưu ảnh

const ProductCard = ({ product, variant = "PeopleAlsoBought", disableLink = false }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const { user } = useUserStore();
  const { addToCart } = useCartStore();

  // --- 1. LOGIC XỬ LÝ DỮ LIỆU ---
  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) return toast.error("Vui lòng đăng nhập", { id: "login" });
    addToCart(product);
    toast.success("Đã thêm vào giỏ hàng");
  };

  const originalPrice = Number(product.price) || 0;
  const percent = Number(product.salePercentage) || 0;
  // Logic Sale: Chấp nhận mọi kiểu dữ liệu (true, "true", 1)
  const isSale = (product.isSale === true || product.isSale === "true" || product.isSale === 1) && percent > 0;
  const discountedPrice = isSale ? originalPrice * (1 - percent / 100) : originalPrice;

  // Format tiền
  const originalDisplay = originalPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
  const discountedDisplay = discountedPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";

  // Badge Pre-order
  const getPreOrderLabel = (status) => {
    switch (status) {
      case "preorder": return { label: "Pre-Order", color: "bg-purple-500 text-white" };
      case "out": return { label: "Hết hàng", color: "bg-red-500 text-white" };
      case "low": return { label: "Số lượng còn ít", color: "bg-yellow-400 text-gray-900" };
      default: return null;
    }
  };
  const preorderStatus = getPreOrderLabel(product.isPreOrder);

  // --- 2. HIỆU ỨNG 3D (TILT) ---
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

  // --- 3. CẤU HÌNH SIZE ---
  const sizes = {
    category: { width: "w-[160px] sm:w-[200px] lg:w-[260px]", height: "h-[240px] sm:h-[300px] lg:h-[380px]", infoPadding: "p-3", button: "px-3 py-1.5 text-sm" },
    featured: { width: "w-[140px] sm:w-[180px] lg:w-[220px]", height: "h-[140px] sm:h-[180px] lg:h-[220px]", infoPadding: "p-2", button: "px-2 py-1 text-xs" },
    default: { width: "w-[150px] sm:w-[190px] lg:w-[250px]", height: "h-[220px] sm:h-[280px] lg:h-[360px]", infoPadding: "p-3", button: "px-3 py-1.5 text-xs" },
    PeopleAlsoBought: { width: "w-[130px] sm:w-[170px] lg:w-[220px]", height: "h-[200px] sm:h-[260px] lg:h-[320px]", infoPadding: "p-2.5", button: "px-2.5 py-1 text-xs" },
  };
  const size = sizes[variant] || sizes.default;
  const isFeedback = product.category === "feedback";

  // ==================================================================================
  // ✅ 4. GIAO DIỆN CHUNG (Được lưu vào biến để tái sử dụng -> Code ngắn hơn ở đây)
  // ==================================================================================
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

      {/* --- Badge Container --- */}
      <div className="absolute top-2 right-2 z-40 flex flex-col items-end gap-1 pointer-events-none">
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

      {/* --- Ảnh sản phẩm (Đã tối ưu) --- */}
      <div className={`w-full overflow-hidden ${size.height}`}>
        {/* Trong file ProductCard.jsx, tìm thẻ img */}
<img
  // Dùng size 400 là chuẩn cho thẻ sản phẩm (đủ nét trên retina)
  src={optimizeUrl(product.image, 400)} 
  alt={product.name}
  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
  
  // ✅ TỐI ƯU QUAN TRỌNG:
  // Nếu là card dùng cho "category" (lưới lớn), ta để loading lazy
  // Nếu là "featured" (thường ở đầu trang), ta có thể bỏ lazy để hiện nhanh hơn
  loading="lazy"
  
  // Xử lý lỗi ảnh bằng ảnh base64 nhẹ hoặc ảnh nội bộ, tránh gọi link ngoài
  onError={(e) => {
    e.target.onerror = null; // Tránh loop vô tận
    e.target.src = "/placeholder.png"; // Nên có 1 file ảnh nhẹ trong thư mục public
  }}
/>
      </div>

      {/* --- Thông tin bên dưới (Chỉ hiện nếu không phải Feedback) --- */}
      {!isFeedback && (
        <div className={`absolute bottom-0 left-0 right-0 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-500 ease-in-out bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent z-30 ${size.infoPadding}`}>
          <h5 className="font-semibold text-white truncate text-sm mb-1">{product.name}</h5>
          
          {/* Logic hiển thị giá Sale */}
          <div className="mb-2 min-h-[1.5rem] flex items-end">
            {isSale ? (
               <div className="flex flex-col items-start leading-none gap-0.5">
                  <div className="flex items-center gap-2">
                     <span className="text-red-400 font-bold text-lg">{discountedDisplay}</span>
                     <span className="text-gray-300 text-[10px] line-through decoration-gray-400 opacity-80">{originalDisplay}</span>
                  </div>
               </div>
            ) : (
               <span className="text-white font-bold text-sm">{originalDisplay}</span>
            )}
          </div>

          <button className={`flex items-center justify-center w-full rounded-md bg-white/90 text-gray-950 hover:bg-blue-600 hover:text-white active:scale-95 font-medium shadow-sm transition-all ${size.button}`} onClick={handleAddToCart}>
            <ShoppingCart size={14} className="mr-1.5" /> Thêm giỏ
          </button>
        </div>
      )}
    </div>
  );

  // ==================================================================================
  // ✅ 5. RENDER CONDITIONAL (Dùng lại CardContent -> Code không bị lặp lại)
  // ==================================================================================

  // Trường hợp 1: Feedback
  if (isFeedback) {
     const isInternal = product.productLink && product.productLink.includes(window.location.origin);
     // Nếu link nội bộ -> Dùng Link (SPA navigation)
     if (isInternal) {
        return <Link to={product.productLink.replace(window.location.origin, "")} className="group relative block">{CardContent}</Link>;
     }
     // Nếu link ngoài -> Dùng thẻ a (Mở tab mới)
     return <a href={product.productLink || "#"} target="_blank" rel="noopener noreferrer" className="group relative block">{CardContent}</a>;
  }

  // Trường hợp 2: Disable Link (chỉ xem, không bấm)
  if (disableLink) return <div className="group relative block">{CardContent}</div>;

  // Trường hợp 3: Sản phẩm bình thường -> Vào trang chi tiết
  return <Link to={`/product/${product._id}`} className="group relative block">{CardContent}</Link>;
};

export default ProductCard;