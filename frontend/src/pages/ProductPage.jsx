// src/pages/ProductDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";
import {  motion } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Facebook,
  Instagram,
} from "lucide-react";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import LoadingSpinner from "../components/LoadingSpinner";
import { useUserStore } from "../stores/useUserStore";
import ContactModal from "../components/ContactModal";
const ProductDetailPage = () => {
  const { id } = useParams();
  const { selectedProduct, fetchProductById, loading } = useProductStore();
  const { addToCart, cart } = useCartStore();
  const { user } = useUserStore();
  const [showContactModal, setShowContactModal] = useState(false);
  const [rate, setRate] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const visibleCount = 3;

  useEffect(() => {
    fetchProductById(id);
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setRate(data.rates.VND))
      .catch((err) => console.error("Failed to fetch rate:", err));
  }, [id, fetchProductById]);

  useEffect(() => {
    if (selectedProduct && selectedProduct.image) {
      setMainImage(selectedProduct.image);
    }
  }, [selectedProduct]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );

  if (!selectedProduct)
    return (
      <p className="text-gray-600 text-center mt-10">
        Không tìm thấy sản phẩm
      </p>
    );

  const allThumbnails = [
    selectedProduct.image,
    ...(Array.isArray(selectedProduct.thumbnails)
      ? selectedProduct.thumbnails
      : []),
  ];
  const canScroll = allThumbnails.length > visibleCount;
  const visibleThumbnails = allThumbnails.slice(
    startIndex,
    startIndex + visibleCount
  );

  const handleNext = () => {
    if (startIndex + visibleCount < allThumbnails.length)
      setStartIndex((prev) => prev + 1);
  };
  const handlePrev = () => {
    if (startIndex > 0) setStartIndex((prev) => prev - 1);
  };

  const vndDisplay =
    rate != null
      ? (
          Math.floor(selectedProduct.price / 1000) * 1000
        ).toLocaleString("vi-VN") + "đ"
      : "";

  const fallbackImage = "/images/no-image.jpg";

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm giỏ hàng", { id: "login" });
      return;
    }
    addToCart(selectedProduct);
    toast.success("Đã thêm vào giỏ hàng");
  };



 return (
  <div className="max-w-5xl mx-auto p-6 bg-white text-gray-900 pt-30">
    <div className="flex flex-col md:flex-row gap-8">
      {/* Ảnh sản phẩm */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[464px] aspect-[3/4] rounded-lg shadow-lg overflow-hidden bg-gray-100 relative">
          <img
            src={mainImage || fallbackImage}
            alt={selectedProduct.name}
            onLoad={() => setIsImageLoading(false)}
            onError={(e) => (e.target.src = fallbackImage)}
            className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-all duration-500 ease-in-out ${
              isImageLoading ? "opacity-0 scale-105" : "opacity-100 hover:scale-110"
            }`}
          />
        </div>

        {/* Thumbnails */}
        {allThumbnails.length > 0 && (
          <div className="relative flex items-center justify-center mt-4 w-full max-w-[464px] overflow-visible">
            {canScroll && startIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute -left-5 z-20 bg-white/90 hover:bg-white text-gray-800 shadow-md rounded-full p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex gap-3 justify-center items-center overflow-visible relative w-full">
              <motion.div
                key={startIndex}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex gap-3"
              >
                {visibleThumbnails.map((thumb, index) => (
                  <div key={index + startIndex} className="relative flex-shrink-0 overflow-visible">
                    <motion.img
                      src={thumb || fallbackImage}
                      alt={`thumb-${index}`}
                      onClick={() => {
                        if (thumb !== mainImage) {
                          setIsImageLoading(true);
                          setMainImage(thumb);
                        }
                      }}
                      onError={(e) => (e.target.src = fallbackImage)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-[116px] h-[140px] object-cover rounded-md cursor-pointer border-2 transition-all duration-300 ${
                        mainImage === thumb
                          ? "border-gray-900 scale-110 shadow-md z-10"
                          : "border-gray-200 hover:border-gray-500"
                      }`}
                    />
                  </div>
                ))}
              </motion.div>
            </div>
            {canScroll && startIndex + visibleCount < allThumbnails.length && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute -right-5 z-20 bg-white/90 hover:bg-white text-gray-800 shadow-md rounded-full p-2"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-lg space-y-4">
          <h1 className="text-3xl font-bold">{selectedProduct.name}</h1>
          <div className="flex items-center gap-3">
            {vndDisplay && (
              <p className="text-gray-500 text-2xl font-semibold">{vndDisplay}</p>
            )}
          </div>

          <p className="text-gray-600 whitespace-pre-line">{selectedProduct.description}</p>

          <div className="mt-4 flex gap-3">
            {/* ✅ Nút Liên hệ */}
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg bg-black hover:bg-gray-700 text-white font-medium transition active:scale-95 shadow-sm"
            >
              💬 Liên hệ
            </button>

            {/* ✅ Nút Thêm vào giỏ */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-700 text-gray-900 hover:text-white font-medium transition active:scale-95 shadow-sm"
            >
              <ShoppingCart size={16} className="mr-1" />
              Thêm vào giỏ
            </button>
          </div>
        </div>

        <img
          src="/size.jpg"
          alt="Size Chart"
          className="mt-4 rounded-lg shadow-lg w-full"
          style={{ height: "445px" }}
        />
      </div>
    </div>

    {/* ✅ Chặn “feedback” trong PeopleAlsoBought */}
    {selectedProduct && (
      <div className="mt-16">
        <PeopleAlsoBought
          excludeIds={[id, ...cart.map((item) => item._id)]}
          filterFn={(p) => (p.category || "").toLowerCase() !== "feedback"}
        />
      </div>
    )}

    {showContactModal && (
  <ContactModal
    product={selectedProduct}
    onClose={() => setShowContactModal(false)}
    rate={rate}
  />
)}
  </div>
  
);
};

export default ProductDetailPage;
