// src/pages/ProductDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import LoadingSpinner from "../components/LoadingSpinner"; // ✅ Thêm dòng này

const ProductDetailPage = () => {
  const { id } = useParams();
  const { selectedProduct, fetchProductById, loading } = useProductStore();
  const { cart } = useCartStore();

  const [rate, setRate] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 3;

  // ---------- NEW: slider state for zoom controls ----------
  const [sliderValue, setSliderValue] = useState(1);

  useEffect(() => {
    fetchProductById(id);
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setRate(data.rates.VND))
      .catch((err) => console.error("Failed to fetch rate:", err));
  }, [id, fetchProductById]);

  useEffect(() => {
    if (selectedProduct) setMainImage(selectedProduct.image);
  }, [selectedProduct]);

  // ✅ Nếu đang loading -> hiển thị spinner
  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );

  if (!selectedProduct)
    return <p className="text-gray-600 text-center mt-10">Không tìm thấy sản phẩm</p>;

  const allThumbnails = [selectedProduct.image, ...(selectedProduct.thumbnails || [])];
  const canScroll = allThumbnails.length > visibleCount;

  const handleNext = () => {
    if (startIndex + visibleCount < allThumbnails.length) {
      setStartIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex((prev) => prev - 1);
    }
  };

  const visibleThumbnails = allThumbnails.slice(startIndex, startIndex + visibleCount);

  const vndDisplay =
    rate != null
      ? (
          Math.floor((selectedProduct.price * rate) / 1000) * 1000
        ).toLocaleString("vi-VN") + "đ"
      : "";

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white text-gray-900 pt-30">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Ảnh sản phẩm */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-[464px] aspect-[3/4] rounded-lg shadow-lg overflow-hidden bg-gray-100 relative">
            <img
              src={mainImage}
              alt={selectedProduct.name}
              onLoad={() => setIsImageLoading(false)}
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/928x1120?text=No+Image";
                setIsImageLoading(false);
              }}
              onClick={() => setZoomImage(mainImage)}
              className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-all duration-500 ease-in-out 
              ${isImageLoading ? "opacity-0 scale-105" : "opacity-100 hover:scale-110"}`}
            />
          </div>

          {/* ✅ Thumbnails fix + animation */}
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
                          src={thumb}
                          alt={`thumb-${index}`}
                          onClick={() => {
                            if (thumb !== mainImage) {
                              setIsImageLoading(true);
                              setMainImage(thumb);
                            }
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          className={`w-[116px] h-[140px] object-cover rounded-md cursor-pointer border-2 transition-all duration-300 
                            ${
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
              <p className="text-gray-700 text-2xl font-semibold">
                ${selectedProduct.price}
              </p>
              {vndDisplay && (
                <p className="text-gray-700 text-2xl font-semibold">
                  - {vndDisplay}
                </p>
              )}
            </div>

            <p className="text-gray-600">{selectedProduct.description}</p>

            <button className="mt-4 w-full px-5 py-3 rounded-lg bg-black hover:bg-gray-400 transition text-white hover:text-black font-medium">
              Liên hệ
            </button>
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

      {/* Zoom overlay */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
          >
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 bg-gray-900/70 rounded-full p-2 text-white hover:bg-gray-700 z-50"
                onClick={() => setZoomImage(null)}
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
                    {/* Điều khiển zoom */}
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white px-4 py-2 rounded-lg flex items-center gap-3 z-[60]">
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
                        onClick={() => {
                          zoomOut();
                        }}
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
                        onClick={() => {
                          zoomIn();
                        }}
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

export default ProductDetailPage;
