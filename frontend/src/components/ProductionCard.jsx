import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { optimizeUrl } from "../lib/cloudinary";

const ProductionCard = ({ product }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const navigate = useNavigate();

  const PLACEHOLDER_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

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

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/admin/production/${product._id}`)}
      className="relative overflow-hidden rounded-xl shadow-md transform-gpu will-change-transform hover:shadow-2xl transition-transform duration-300 ease-out bg-white w-[160px] sm:w-[200px] lg:w-[260px] cursor-pointer group block"
    >
      <div ref={glareRef} className="pointer-events-none absolute inset-0 rounded-xl z-20 transition-opacity duration-300" />

      {/* Copy class height chuẩn xác của ProductCard */}
      <div className="w-full overflow-hidden h-[240px] sm:h-[300px] lg:h-[380px]">
        <img
          src={product.image ? optimizeUrl(product.image, 400) : PLACEHOLDER_IMAGE}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-500 ease-in-out bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent z-30 px-2 py-1.5 sm:p-3 flex items-end h-1/3">
        <h5 className="font-semibold text-white truncate text-[10.5px] sm:text-sm mb-0 sm:mb-0.5 leading-tight w-full text-center uppercase tracking-wider">
          {product.name}
        </h5>
      </div>
    </div>
  );
};

export default ProductionCard;