import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import LoadingSpinner from "../components/LoadingSpinner";
import ContactModal from "../components/ContactModal";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ProductPage = () => {
  const { id } = useParams();
  const productStore = useProductStore.getState();
  const { addToCart, cart } = useCartStore();
  const { user } = useUserStore();

  const [product, setProduct] = useState(productStore.selectedProduct);
  const [mainImage, setMainImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [sliderValue, setSliderValue] = useState(1);
  const [showContactModal, setShowContactModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const visibleCount = 3;

  const memoizedExcludeIds = useMemo(
    () => [id, ...cart.map((item) => item._id)],
    [id, cart]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await productStore.fetchProductById(id);
      if (mounted && data) {
        setProduct(data);
        setMainImage(data.image || "/images/no-image.jpg");
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );

  if (!product)
    return (
      <p className="text-gray-600 text-center mt-10">Không tìm thấy sản phẩm</p>
    );

  // --- 1. TÍNH TOÁN GIÁ & SALE ---
  const originalPrice = Number(product.price) || 0;
  const percent = Number(product.salePercentage) || 0;
  // Kiểm tra Sale: Chấp nhận true, "true", 1... miễn là có giá trị truthy VÀ % > 0
  const isSale = (product.isSale === true || product.isSale === "true" || product.isSale === 1) && percent > 0;

  const discountedPrice = isSale 
    ? originalPrice * (1 - percent / 100) 
    : originalPrice;

  // Format tiền tệ
  const originalPriceDisplay = originalPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
  const discountedPriceDisplay = discountedPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";

  // --- Logic Ảnh & Slider ---
  const allThumbnails = [
    product.image,
    ...(Array.isArray(product.thumbnails) ? product.thumbnails : []),
  ].filter(Boolean);

  const canScroll = allThumbnails.length > visibleCount;
  const visibleThumbnails = allThumbnails.slice(
    startIndex,
    startIndex + visibleCount
  );

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (startIndex + visibleCount < allThumbnails.length)
      setStartIndex((prev) => prev + 1);
  };

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (startIndex > 0) setStartIndex((prev) => prev - 1);
  };

  const fallbackImage = "/images/no-image.jpg";

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm giỏ hàng", { id: "login" });
      return;
    }
    addToCart(product);
    toast.success("Đã thêm vào giỏ hàng");
  };

  const handleThumbnailClick = (e, thumb) => {
    e.preventDefault();
    e.stopPropagation();
    if (thumb !== mainImage) {
      setIsImageLoading(true);
      setMainImage(thumb);
    }
  };

  const handleMainImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setZoomImage(mainImage);
  };

  const stopDown = (e) => e.stopPropagation();

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white text-gray-900 pt-30">
      <div className="flex flex-col md:flex-row gap-8">
        {/* CỘT TRÁI: ẢNH SẢN PHẨM */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-[464px] aspect-[3/4] rounded-lg shadow-lg overflow-hidden bg-gray-100 relative">
            <img
              src={mainImage || fallbackImage}
              alt={product.name}
              onLoad={() => setIsImageLoading(false)}
              onError={(e) => (e.target.src = fallbackImage)}
              onClick={handleMainImageClick}
              onMouseDown={stopDown}
              className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-all duration-500 ease-in-out ${
                isImageLoading
                  ? "opacity-0 scale-105"
                  : "opacity-100 hover:scale-110"
              }`}
            />
            {/* Badge Sale trên ảnh lớn (Optional) */}
            {isSale && (
                <span className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md z-10">
                    -{percent}%
                </span>
            )}
          </div>

          {allThumbnails.length > 1 && (
            <div className="relative flex items-center justify-center mt-4 w-full max-w-[464px]">
              {canScroll && startIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute -left-5 z-20 bg-white/90 hover:bg-white text-gray-800 shadow-md rounded-full p-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              <div className="flex gap-3 justify-center items-center w-full">
                {visibleThumbnails.map((thumb, index) => (
                  <motion.img
                    key={thumb + index}
                    src={thumb || fallbackImage}
                    alt={`thumb-${index}`}
                    onClick={(e) => handleThumbnailClick(e, thumb)}
                    onMouseDown={stopDown}
                    onError={(e) => (e.target.src = fallbackImage)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-[116px] h-[140px] object-cover rounded-md cursor-pointer border-2 transition-all duration-300 ${
                      mainImage === thumb
                        ? "border-gray-900 scale-110 shadow-md z-10"
                        : "border-gray-200 hover:border-gray-500"
                    }`}
                  />
                ))}
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

        {/* CỘT PHẢI: THÔNG TIN SẢN PHẨM */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-lg space-y-4">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            
            {/* ✅ HIỂN THỊ GIÁ SALE */}
            <div className="flex items-center gap-4 flex-wrap">
                {isSale ? (
                    <>
                        {/* Giá mới màu đỏ */}
                        <p className="text-red-600 text-3xl font-bold">{discountedPriceDisplay}</p>
                        
                        {/* Giá cũ gạch ngang */}
                        <p className="text-gray-400 text-xl line-through decoration-2 decoration-gray-300">{originalPriceDisplay}</p>
                        
                        {/* Badge % giảm */}
                        <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-1 rounded-md border border-red-200">
                            -{percent}% SALE
                        </span>
                    </>
                ) : (
                    // Giá thường
                    <p className="text-gray-500 text-2xl font-semibold">{originalPriceDisplay}</p>
                )}
            </div>

            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
              {product.description}
            </p>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowContactModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-black hover:bg-gray-800 text-white font-medium transition active:scale-95 shadow-sm"
              >
                💬 Liên hệ
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition active:scale-95 shadow-sm"
              >
                <ShoppingCart size={20} className="mr-1" />
                Thêm vào giỏ
              </button>
            </div>
          </div>
          
          <img
            src="/model.jpg"
            alt="Model Size"
            className="mt-6 rounded-lg shadow-lg w-full object-cover"
          />
          <img
            src="/size.jpg"
            alt="Size Chart"
            className="mt-6 rounded-lg shadow-lg w-full object-contain bg-white"
            onMouseDown={stopDown}
          />
        </div>
      </div>

      <div className="mt-16">
        <PeopleAlsoBought
          key={id}
          excludeIds={memoizedExcludeIds}
        />
      </div>

      {showContactModal && (
        <ContactModal
          product={product}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {/* Zoom overlay */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
          >
            <motion.div
              className="relative w-full h-full flex items-center justify-center p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomImage(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors z-50 backdrop-blur-sm"
              >
                <X className="h-8 w-8" />
              </button>

              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={5}
                wheel={{ step: 0.2 }}
                onZoomChange={(payload) => {
                  const s = payload?.scale ?? payload?.state?.scale;
                  if (typeof s === "number") setSliderValue(s);
                }}
              >
                {({ zoomIn, zoomOut, resetTransform, setTransform, state }) => (
                  <>
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-4 z-[110] border border-white/10">
                      <button
                        onClick={() => {
                          resetTransform();
                          setSliderValue(1);
                        }}
                        className="text-xs font-bold hover:text-blue-400 transition-colors"
                      >
                        RESET
                      </button>
                      <button
                        onClick={zoomOut}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={sliderValue}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSliderValue(val);
                          const posX = state?.positionX ?? 0;
                          const posY = state?.positionY ?? 0;
                          setTransform(posX, posY, val);
                        }}
                        className="w-32 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                      <button
                        onClick={zoomIn}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <TransformComponent wrapperClass="!w-full !h-full flex items-center justify-center">
                      <img
                        src={zoomImage}
                        alt="Zoomed"
                        className="max-h-screen max-w-screen object-contain"
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductPage;