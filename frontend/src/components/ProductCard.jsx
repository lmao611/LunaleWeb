import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const ProductCard = ({ product, variant = "PeopleAlsoBought" }) => {
  const [rate, setRate] = useState(null);
  const cardRef = useRef(null);
  const glareRef = useRef(null);

  const { user } = useUserStore();
  const { addToCart } = useCartStore();

  // Fetch tỷ giá USD → VND
  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setRate(data.rates.VND))
      .catch(() => {});
  }, []);

  // Add to cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm giỏ hàng", { id: "login" });
      return;
    }
    addToCart(product);
    toast.success("Đã thêm vào giỏ hàng");
  };

  // Giá VND
  let vndDisplay = "";
  if (rate != null) {
    const raw = product.price * rate;
    const rounded = Math.floor(raw / 1000) * 1000;
    vndDisplay = rounded.toLocaleString("vi-VN") + "đ";
  }

  // Tilt + Glare (desktop only)
  const handleMouseMove = (e) => {
    if (window.innerWidth < 640) return; // disable on mobile
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
    const opacity = Math.min(
      0.15,
      Math.hypot(x - centerX, y - centerY) / (rect.width / 1.5)
    );
    glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,${opacity}) 0%, transparent 80%)`;
  };

  const handleMouseLeave = () => {
    if (window.innerWidth < 640) return;
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;
    card.style.transform = "perspective(800px) scale(1) rotateX(0deg) rotateY(0deg)";
    glare.style.background = "transparent";
  };

  // Kích thước theo variant
  const sizes = {
    category: { width: "w-72", height: "h-96", infoPadding: "p-3", button: "px-3 py-1.5 text-sm" },
    featured: { width: "w-40", height: "h-40", infoPadding: "p-2", button: "px-2 py-1 text-xs" },
    default: { width: "w-56", height: "h-80", infoPadding: "p-3", button: "px-3 py-1.5 text-xs" },
  };

  const size = variant === "category" ? sizes.category
             : variant === "featured" ? sizes.featured
             : sizes.default;

  return (
    <Link to={`/product/${product._id}`} className="group relative block">
      {/* Card wrapper */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative overflow-hidden rounded-xl shadow-md transform-gpu will-change-transform
          hover:shadow-2xl transition-transform duration-300 ease-out
          ${size.width}`}
      >
        {/* Glare */}
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 rounded-xl z-20 transition-opacity duration-300"
        />

        {/* Image */}
        <div className={`w-full overflow-hidden ${size.height}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) =>
              (e.target.src = "https://via.placeholder.com/300x400?text=No+Image")
            }
          />
        </div>

        {/* Info + Button */}
        <div
          className={`absolute bottom-0 left-0 right-0
                     translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0
                     transition-transform duration-500 ease-in-out
                     bg-gradient-to-t from-gray-900/80 to-gray-600/40 z-30
                     ${size.infoPadding}`}
        >
          <h5 className="font-semibold text-white truncate text-sm">{product.name}</h5>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white font-bold text-sm">${product.price}</span>
            {vndDisplay && variant !== "featured" && (
              <span className="text-white font-bold text-sm">{vndDisplay}</span>
            )}
          </div>
          <button
            className={`mt-2 flex items-center justify-center w-full rounded-md 
                       bg-gray-200 text-gray-950 hover:bg-gray-700 hover:text-white active:scale-95
                       ${size.button}`}
            onClick={handleAddToCart}
          >
            <ShoppingCart size={variant === "featured" ? 12 : 14} className="mr-1" />
            Add
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
