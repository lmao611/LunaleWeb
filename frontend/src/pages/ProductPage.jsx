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

  // ✅ useMemo luôn ở đây, không phụ thuộc điều kiện
  const memoizedExcludeIds = useMemo(
    () => [id, ...cart.map((item) => item._id)],
    [id, cart]
  );

  // ✅ fetch chỉ 1 lần khi id đổi
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

  const vndDisplay =
    (Math.floor(product.price / 1000) * 1000).toLocaleString("vi-VN") + "đ";

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
        {/* ảnh sản phẩm */}
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

        {/* thông tin sản phẩm */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-lg space-y-4">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-500 text-2xl font-semibold">{vndDisplay}</p>
            <p className="text-gray-600 whitespace-pre-line">
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg bg-black hover:bg-gray-700 text-white font-medium transition active:scale-95 shadow-sm"
              >
                💬 Liên hệ
              </button>

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
            src="/model.jpg"
            alt="Model Size"
            className="mt-4 rounded-lg shadow-lg w-full"
          />
          <img
            src="/size.jpg"
            alt="Size Chart"
            className="mt-4 rounded-lg shadow-lg w-full"
            style={{ height: "445px" }}
            onMouseDown={stopDown}
          />
        </div>
      </div>

      <div className="mt-16">
        <PeopleAlsoBought
          key={id}
          excludeIds={memoizedExcludeIds}
          filterFn={(p) => (p.category || "").toLowerCase() !== "feedback"}
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
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
          >
            <motion.div
              className="relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomImage(null)}
                className="absolute top-2 right-2 bg-gray-900/70 rounded-full p-2 text-white hover:bg-gray-700 z-50"
              >
                <X className="h-6 w-6" />
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
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white px-4 py-2 rounded-lg flex items-center gap-3 z-[110]">
                      <button
                        onClick={() => {
                          resetTransform();
                          setSliderValue(1);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm"
                      >
                        Reset
                      </button>
                      <button
                        onClick={zoomOut}
                        className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md text-sm"
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
                        className="w-40 accent-blue-600"
                      />
                      <button
                        onClick={zoomIn}
                        className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md text-sm"
                      >
                        +
                      </button>
                    </div>

                    <TransformComponent>
                      <img
                        src={zoomImage}
                        alt="Zoomed"
                        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg object-contain cursor-grab active:cursor-grabbing"
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
