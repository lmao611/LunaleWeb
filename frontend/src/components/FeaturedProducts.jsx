import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { useProductStore } from "../stores/useProductStore";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const FeaturedProducts = () => {
  const { products, fetchFeaturedProducts } = useProductStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [rate, setRate] = useState(null);
  const { addToCart } = useCartStore();
  const { user } = useUserStore();


  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setRate(data.rates.VND))
      .catch((err) => console.error("Failed to fetch rate:", err));
  }, []);


  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerPage(1);
      else if (window.innerWidth < 1024) setItemsPerPage(2);
      else if (window.innerWidth < 1280) setItemsPerPage(3);
      else setItemsPerPage(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () =>
    setCurrentIndex((prev) =>
      Math.min(prev + itemsPerPage, products.length - itemsPerPage)
    );
  const prevSlide = () =>
    setCurrentIndex((prev) => Math.max(prev - itemsPerPage, 0));

  const isStartDisabled = currentIndex === 0;
  const isEndDisabled = currentIndex >= products.length - itemsPerPage;

  const getVND = (usd) => {
    if (!rate) return "";
    const raw = usd * rate;
    const rounded = Math.floor(raw / 1000) * 1000;
    return rounded.toLocaleString("vi-VN") + "đ";
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng", { id: "login" });
      return;
    }
    addToCart(product);
    toast.success("Đã thêm vào giỏ hàng");
  };

  if (!products?.length)
    return (
      <div className="text-center text-gray-500 py-20">
        Không có sản phẩm nổi bật.
      </div>
    );

  return (
    <div className="py-12 bg-transparent relative">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-5xl sm:text-6xl font-bold text-blue-800 mb-6">
          Sản phẩm được ưa thích
        </h2>

        <div className="relative">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${(currentIndex * 100) / itemsPerPage}%)`,
            }}
          >
            {products.map((product) => (
              <Card
                key={product._id}
                product={product}
                rate={rate}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>


          <button
            onClick={prevSlide}
            disabled={isStartDisabled}
            className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
              isStartDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-800 hover:bg-blue-700"
            }`}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            disabled={isEndDisabled}
            className={`absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
              isEndDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-800 hover:bg-blue-700"
            }`}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};


const Card = ({ product, rate, onAddToCart }) => {
  const cardRef = useRef(null);
  const glareRef = useRef(null);

  const handleMouseMove = (e) => {
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
    const opacity = Math.min(
      0.25,
      Math.hypot(x - centerX, y - centerY) / (rect.width / 1.5)
    );
    glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,${opacity}) 0%, transparent 80%)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;
    card.style.transform =
      "perspective(800px) scale(1) rotateX(0deg) rotateY(0deg)";
    glare.style.background = "transparent";
  };

  return (
    <Link
      to={`/product/${product._id}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative block w-64 flex-shrink-0 overflow-hidden rounded-xl shadow-md
        hover:z-10 hover:shadow-2xl hover:ring-2 hover:ring-blue-400/40
        transition-transform duration-200 ease-out mx-3 bg-white/80 backdrop-blur-sm"
    >

      <div
        ref={glareRef}
        className="pointer-events-none absolute inset-0 rounded-xl z-20 transition-all duration-300"
      ></div>


      <div className="w-full h-72 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) =>
            (e.target.src =
              "https://via.placeholder.com/300x400?text=No+Image")
          }
        />
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0
                   transition-transform duration-500 ease-in-out
                   bg-gradient-to-t from-blue-900/80 to-blue-600/40 z-30 p-3"
      >
        <h5 className="font-semibold text-white truncate text-sm">
          {product.name}
        </h5>
        <div className="flex items-center justify-between mt-1">
          <span className="text-blue-300 font-bold text-sm">
            ${product.price.toFixed(2)}
          </span>
          {rate && (
            <span className="text-blue-300 font-bold text-xs">
              {getVNDCurrency(product.price, rate)}
            </span>
          )}
        </div>
        <button
          className="mt-2 flex items-center justify-center w-full rounded-md 
                     bg-blue-600 text-white hover:bg-blue-700 active:scale-95
                     px-3 py-1.5 text-xs"
          onClick={(e) => onAddToCart(e, product)}
        >
          <ShoppingCart size={14} className="mr-1" />
          Add
        </button>
      </div>
    </Link>
  );
};

const getVNDCurrency = (usd, rate) => {
  const raw = usd * rate;
  const rounded = Math.floor(raw / 1000) * 1000;
  return rounded.toLocaleString("vi-VN") + "đ";
};

export default FeaturedProducts;
