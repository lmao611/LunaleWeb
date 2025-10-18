// src/pages/ProductDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Facebook,
  Instagram,
} from "lucide-react";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import LoadingSpinner from "../components/LoadingSpinner";
import { useUserStore } from "../stores/useUserStore";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { selectedProduct, fetchProductById, loading } = useProductStore();
  const { addToCart, cart } = useCartStore();
  const { user } = useUserStore();

  const [rate, setRate] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("M");
  const visibleCount = 3;
  const [sliderValue, setSliderValue] = useState(1);

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

  // ✅ Messenger handle
  const handleFacebookContact = () => {
    const fbPage = "pham.ai.197182";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const message = `- Tên sản phẩm: ${selectedProduct?.name}
- Link: ${window.location.href}
- Size: ${size}
- Số lượng: ${quantity}
Tôi muốn mua sản phẩm này.`;

    // Sao chép nội dung để người dùng dán vào nếu cần
    navigator.clipboard
      .writeText(message)
      .then(() =>
        toast.success("✅ Đã sao chép nội dung, dán vào Messenger nhé!")
      )
      .catch(() => toast.error("Không thể sao chép nội dung!"));

    // Mở Messenger app hoặc web
    if (isMobile) {
      window.location.href = `fb://messaging/${fbPage}`;
      setTimeout(() => {
        window.open(
          `https://m.me/${fbPage}?ref=${encodeURIComponent(message)}`,
          "_blank"
        );
      }, 1500);
    } else {
      window.open(
        `https://m.me/${fbPage}?ref=${encodeURIComponent(message)}`,
        "_blank"
      );
    }
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
              onClick={() => setZoomImage(mainImage || fallbackImage)}
              className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-all duration-500 ease-in-out ${
                isImageLoading
                  ? "opacity-0 scale-105"
                  : "opacity-100 hover:scale-110"
              }`}
            />
          </div>

          {/* Thumbnails */}
          {allThumbnails.length > 0 && (
            <div className="relative flex items-center justify-center mt-4 w-full max-w-[464px] overflow-visible">
              {canScroll && startIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute -left-5 z-20 bg-white/90 hover:bg-white text-gray-800 shadow-md rounded-full p-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex gap-3 justify-center items-center overflow-visible relative w-full">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={startIndex}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="flex gap-3"
                  >
                    {visibleThumbnails.map((thumb, index) => (
                      <div
                        key={index + startIndex}
                        className="relative flex-shrink-0 overflow-visible"
                      >
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
                </AnimatePresence>
              </div>
              {canScroll &&
                startIndex + visibleCount < allThumbnails.length && (
                  <button
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
                <p className="text-gray-500 text-2xl font-semibold">
                  {vndDisplay}
                </p>
              )}
            </div>

            <p className="text-gray-600 whitespace-pre-line">
              {selectedProduct.description}
            </p>

            <div className="mt-4 flex gap-3">
              {/* ✅ Nút Liên hệ */}
              <button
                onClick={() => setShowContactModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg 
                 bg-black hover:bg-gray-700 text-white font-medium 
                 transition active:scale-95 shadow-sm"
              >
                💬 Liên hệ
              </button>

              {/* ✅ Nút Thêm vào giỏ */}
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg 
                 bg-gray-200 hover:bg-gray-700 text-gray-900 hover:text-white font-medium transition 
                 active:scale-95 shadow-sm"
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

      {selectedProduct && (
        <div className="mt-16">
          <PeopleAlsoBought excludeIds={[id, ...cart.map((item) => item._id)]} />
        </div>
      )}

      {/* 🟢 Modal Liên hệ */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-2xl w-[95%] max-w-md relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-black"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold mb-4 text-center">
                Liên hệ về sản phẩm
              </h2>
              <p className="text-center text-gray-600 mb-4">
                {selectedProduct.name}
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-black outline-none"
                  >
                    {["S", "M", "L", "XL"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium block mb-2">
                    Liên hệ qua
                  </label>
                  <div className="flex justify-center gap-4">
                    {/* ✅ Facebook */}
                    <button
                      onClick={handleFacebookContact}
                      className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-300 text-gray-700 
                        hover:bg-[#1877F2] hover:text-white transition-colors"
                    >
                      <Facebook className="w-6 h-6" />
                    </button>

                    {/* ✅ Instagram */}
                    <a
                      href="https://www.instagram.com/lunale.official"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-300 text-gray-700 
                        hover:text-white transition-all"
                      style={{ transition: "all 0.3s" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(45deg, #f58529, #dd2a7b, #8134af, #515bd4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Instagram className="w-6 h-6" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetailPage;
