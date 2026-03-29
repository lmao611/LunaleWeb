import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ShoppingCart, CreditCard, QrCode, CheckCircle } from "lucide-react";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import LoadingSpinner from "../components/LoadingSpinner";
import ContactModal from "../components/ContactModal";
import AddToCartModal from "../components/AddToCartModal"; 
import GuestOrderModal from "../components/GuestOrderModal";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ProductPage = () => {
  const { id } = useParams();
  const productStore = useProductStore.getState();
  const { cart, placeOrder } = useCartStore(); 
  const { user, setShowUserBox } = useUserStore();

  const [product, setProduct] = useState(productStore.selectedProduct);
  const [mainImage, setMainImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [sliderValue, setSliderValue] = useState(1);
  const [showContactModal, setShowContactModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

  const [showQuickBuyModal, setShowQuickBuyModal] = useState(false);
  const [buySize, setBuySize] = useState("M");
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [showQR, setShowQR] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  const visibleCount = 3;

  const memoizedExcludeIds = useMemo(
    () => [id, ...cart.map((item) => item._id)],
    [id, cart]
  );

  useEffect(() => {
    let mounted = true;
    const loadProduct = async () => {
      setLoading(true);
      const data = await productStore.fetchProductById(id);
      if (mounted && data) {
        setProduct(data);
        setMainImage(data.image || "/images/no-image.jpg");
      }
      setLoading(false);
    };
    loadProduct();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><LoadingSpinner /></div>;
  if (!product) return <p className="text-gray-600 text-center mt-10">Không tìm thấy sản phẩm</p>;

  const originalPrice = Number(product.price) || 0;
  const percent = Number(product.salePercentage) || 0;
  const isSale = (product.isSale === true || product.isSale === "true" || product.isSale === 1) && percent > 0;
  const discountedPrice = isSale ? originalPrice * (1 - percent / 100) : originalPrice;
  const originalPriceDisplay = originalPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";
  const discountedPriceDisplay = discountedPrice.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "đ";

  const allThumbnails = [product.image, ...(Array.isArray(product.thumbnails) ? product.thumbnails : [])].filter(Boolean);
  const canScroll = allThumbnails.length > visibleCount;
  const visibleThumbnails = allThumbnails.slice(startIndex, startIndex + visibleCount);
  const handleNext = (e) => { e.preventDefault(); e.stopPropagation(); if (startIndex + visibleCount < allThumbnails.length) setStartIndex((prev) => prev + 1); };
  const handlePrev = (e) => { e.preventDefault(); e.stopPropagation(); if (startIndex > 0) setStartIndex((prev) => prev - 1); };
  const fallbackImage = "/images/no-image.jpg";

  const handleAddToCart = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error("Vui lòng đăng nhập để thêm giỏ hàng", { id: "login" }); return; }
    setShowAddToCartModal(true);
  };

  const handleBuyNow = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { 
      setIsGuestModalOpen(true);
      return; 
    }
    if (!user.phoneNumber || !user.direction) { toast.error("Vui lòng cập nhật địa chỉ trước!"); setShowUserBox(true); return; }
    setShowQuickBuyModal(true);
  };

  const submitQuickOrder = async (isPaid = false) => {
      setIsOrdering(true);
      const totalAmount = discountedPrice * buyQuantity; 
      
      const orderData = {
          products: [{
              product: product._id,
              name: product.name,
              image: product.image,
              price: discountedPrice, 
              quantity: buyQuantity,
              size: buySize
          }],
          totalAmount: totalAmount / 25000, 
          note: "Mua ngay từ trang sản phẩm",
          paymentMethod: paymentMethod,
          isPaid: isPaid
      };

      const res = await placeOrder(orderData);
      setIsOrdering(false);
      
      if (res.success) {
          setShowQuickBuyModal(false);
          setShowQR(false);
          toast.success(isPaid ? "Thanh toán thành công! Đơn hàng đang xử lý." : "Đặt hàng thành công!");
      }
  };

  const handleMainImageClick = (e) => { e.preventDefault(); e.stopPropagation(); setZoomImage(mainImage); };
  const stopDown = (e) => e.stopPropagation();
  const handleThumbnailClick = (e, thumb) => { e.preventDefault(); e.stopPropagation(); if (thumb !== mainImage) { setIsImageLoading(true); setMainImage(thumb); } };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white text-gray-900 pt-30">
      <div className="flex flex-col md:flex-row gap-8">
        
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-[464px] aspect-[3/4] rounded-lg shadow-lg overflow-hidden bg-gray-100 relative">
            <img 
              src={mainImage || fallbackImage} 
              alt={product.name} 
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
              style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
              onLoad={() => setIsImageLoading(false)} 
              onError={(e) => (e.target.src = fallbackImage)} 
              onClick={handleMainImageClick} 
              onMouseDown={stopDown} 
              className={`absolute inset-0 w-full h-full object-cover select-none cursor-pointer transition-all duration-500 ease-in-out ${isImageLoading ? "opacity-0 scale-105" : "opacity-100 hover:scale-110"}`} 
            />
            {isSale && <span className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md z-10">-{percent}%</span>}
          </div>
          {allThumbnails.length > 1 && (
            <div className="relative flex items-center justify-center mt-4 w-full max-w-[464px]">
              {canScroll && startIndex > 0 && <button type="button" onClick={handlePrev} className="absolute -left-5 z-20 bg-white/90 hover:bg-white text-gray-800 shadow-md rounded-full p-2"><ChevronLeft className="h-5 w-5" /></button>}
              <div className="flex gap-3 justify-center items-center w-full">
                {visibleThumbnails.map((thumb, index) => (
                  <motion.img 
                    key={thumb + index} 
                    src={thumb || fallbackImage} 
                    alt={`thumb-${index}`} 
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                    onClick={(e) => handleThumbnailClick(e, thumb)} 
                    onMouseDown={stopDown} 
                    onError={(e) => (e.target.src = fallbackImage)} 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.97 }} 
                    className={`w-[116px] h-[140px] object-cover select-none rounded-md cursor-pointer border-2 transition-all duration-300 ${mainImage === thumb ? "border-gray-900 scale-110 shadow-md z-10" : "border-gray-200 hover:border-gray-500"}`} 
                  />
                ))}
              </div>
              {canScroll && startIndex + visibleCount < allThumbnails.length && <button type="button" onClick={handleNext} className="absolute -right-5 z-20 bg-white/90 hover:bg-white text-gray-800 shadow-md rounded-full p-2"><ChevronRight className="h-5 w-5" /></button>}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-lg space-y-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-4 flex-wrap">
                {isSale ? (
                    <>
                        <p className="text-red-600 text-3xl font-bold">{discountedPriceDisplay}</p>
                        <p className="text-gray-400 text-xl line-through decoration-2 decoration-gray-300">{originalPriceDisplay}</p>
                        <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-1 rounded-md border border-red-200">-{percent}% SALE</span>
                    </>
                ) : (
                    <p className="text-gray-500 text-2xl font-semibold">{originalPriceDisplay}</p>
                )}
            </div>
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">{product.description}</p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowContactModal(true) }} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-gray-800 text-gray-800 hover:bg-gray-400 font-medium transition active:scale-95 shadow-sm">LIÊN HỆ</button>
              
              <button type="button" onClick={handleAddToCart} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-gray-800 text-gray-800 hover:bg-gray-400 font-medium transition active:scale-95 shadow-sm">
                <ShoppingCart size={20} className="mr-1" />THÊM
              </button>
            </div>
            
            <button type="button" onClick={handleBuyNow} className="w-full py-4 rounded-lg bg-teal-800 hover:bg-teal-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition transform active:scale-[0.98]">
                BUY NOW
            </button>

            <div className="w-full mt-6 rounded-lg overflow-hidden shadow-lg bg-black">
                <video controls playsInline preload="metadata" className="w-full h-auto">
                    <source src="/tutor.mp4#t=0.001" type="video/mp4" />
                </video>
            </div>

          </div>
          <img 
            src="/model.jpg" 
            alt="Model Size" 
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
            className="mt-6 rounded-lg shadow-lg w-full object-cover select-none" 
          />
          <img 
            src="/size.jpg" 
            alt="Size Chart" 
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
            className="mt-6 rounded-lg shadow-lg w-full object-contain bg-white select-none" 
            onMouseDown={stopDown} 
          />
        </div>
      </div>

      <div className="mt-16"><PeopleAlsoBought key={id} excludeIds={memoizedExcludeIds} /></div>
      
      {showContactModal && <ContactModal product={product} onClose={() => setShowContactModal(false)} />}
      {showAddToCartModal && <AddToCartModal product={product} onClose={() => setShowAddToCartModal(false)} />}
      {isGuestModalOpen && <GuestOrderModal isOpen={isGuestModalOpen} onClose={() => setIsGuestModalOpen(false)} product={product} />}

      <AnimatePresence>
        {showQuickBuyModal && (
            <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative max-h-[90vh] overflow-y-auto">
                    <button onClick={() => { setShowQuickBuyModal(false); setShowQR(false); }} className="absolute top-3 right-3 text-gray-500 hover:text-red-500"><X size={24} /></button>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Mua Ngay</h3>
                        
                        {!showQR ? (
                           <div className="space-y-4">
                               <div className="flex gap-4 mb-4">
                                   <img 
                                     src={mainImage} 
                                     draggable="false"
                                     onContextMenu={(e) => e.preventDefault()}
                                     style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                                     className="w-20 h-24 object-cover rounded border select-none" 
                                     alt="prod"
                                   />
                                   <div>
                                       <p className="font-bold line-clamp-2">{product.name}</p>
                                       <p className="text-blue-600 font-bold">{discountedPriceDisplay}</p>
                                   </div>
                               </div>

                               <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">Chọn Size:</label>
                                   <div className="flex gap-2">
                                       {["S", "M", "L", "XL"].map(s => (
                                           <button key={s} onClick={() => setBuySize(s)} className={`w-10 h-10 rounded border flex items-center justify-center transition ${buySize === s ? "bg-black text-white border-black" : "bg-white text-gray-700 hover:border-gray-400"}`}>{s}</button>
                                       ))}
                                   </div>
                               </div>

                               <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng:</label>
                                   <div className="flex items-center gap-3">
                                       <button onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))} className="w-8 h-8 rounded border bg-gray-100 hover:bg-gray-200">-</button>
                                       <span className="font-bold w-8 text-center">{buyQuantity}</span>
                                       <button onClick={() => setBuyQuantity(buyQuantity + 1)} className="w-8 h-8 rounded border bg-gray-100 hover:bg-gray-200">+</button>
                                   </div>
                               </div>

                               <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">Thanh toán:</label>
                                   <div className="flex gap-2">
                                       <button onClick={() => setPaymentMethod("COD")} className={`flex-1 py-2 px-3 border rounded-lg text-sm flex items-center justify-center gap-2 ${paymentMethod === "COD" ? "border-blue-500 bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}>
                                           <ShoppingCart size={16}/> COD
                                       </button>
                                       <button onClick={() => setPaymentMethod("Chuyển khoản")} className={`flex-1 py-2 px-3 border rounded-lg text-sm flex items-center justify-center gap-2 ${paymentMethod === "Chuyển khoản" ? "border-blue-500 bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}>
                                           <QrCode size={16}/> Chuyển khoản
                                       </button>
                                   </div>
                               </div>

                               <div className="border-t pt-4 mt-2">
                                   <div className="flex justify-between font-bold text-lg mb-4">
                                       <span>Tổng tiền:</span>
                                       <span className="text-blue-700">{(discountedPrice * buyQuantity).toLocaleString("vi-VN")}đ</span>
                                   </div>
                                   <button onClick={() => {
                                       if(paymentMethod === "Chuyển khoản") setShowQR(true);
                                       else submitQuickOrder(false);
                                   }} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
                                       {paymentMethod === "Chuyển khoản" ? "Tiếp tục thanh toán" : "Đặt hàng ngay"}
                                   </button>
                               </div>
                           </div>
                        ) : (
                           <div className="text-center">
                               <p className="text-sm text-gray-600 mb-4">Quét mã để thanh toán</p>
                               <div className="border-2 border-blue-500 rounded-lg p-2 inline-block mb-4 max-w-full">
                                   <img 
                                        src="/qr-payment.jpg" 
                                        alt="QR Code" 
                                        draggable="false"
                                        onContextMenu={(e) => e.preventDefault()}
                                        style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                                        className="w-full max-w-[400px] h-auto object-contain mx-auto select-none" 
                                   />
                               </div>
                               <p className="font-bold text-lg text-blue-700 mb-3">
                                   Tổng: {(discountedPrice * buyQuantity).toLocaleString("vi-VN")} đ
                               </p>
                               <p className="text-sm text-gray-400 mb-3">
                                  "Giá trên chưa bao gồm phí ship."
                               </p>
                               <p className="text-sm text-gray-400 mb-6">
                                  "The price above does not include shipping."
                               </p>
                               <div className="flex gap-3">
                                   <button onClick={() => setShowQR(false)} className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Quay lại</button>
                                   <button onClick={() => submitQuickOrder(true)} disabled={isOrdering} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                                       <CheckCircle size={18}/> {isOrdering ? "Xử lý..." : "Đã thanh toán"}
                                   </button>
                               </div>
                           </div>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomImage && (
          <motion.div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)}>
            <motion.div className="relative w-full h-full flex items-center justify-center p-4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.3 }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setZoomImage(null)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors z-50 backdrop-blur-sm"><X className="h-8 w-8" /></button>
              <TransformWrapper initialScale={1} minScale={0.5} maxScale={5} centerOnInit={true} wheel={{ step: 0.2 }} onZoomChange={(payload) => { const s = payload?.scale ?? payload?.state?.scale; if (typeof s === "number") setSliderValue(s); }}>
                {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                  <>
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-4 z-[110] border border-white/10">
                      <button onClick={() => { resetTransform(); setSliderValue(1); }} className="text-xs font-bold hover:text-blue-400 transition-colors">RESET</button>
                      <button onClick={zoomOut} className="hover:bg-white/20 p-1 rounded transition-colors">-</button>
                      <input type="range" min="0.5" max="5" step="0.1" value={sliderValue} onChange={(e) => { const val = parseFloat(e.target.value); setSliderValue(val); centerView(val, 0); }} className="w-32 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white" />
                      <button onClick={zoomIn} className="hover:bg-white/20 p-1 rounded transition-colors">+</button>
                    </div>
                    <TransformComponent wrapperClass="!w-full !h-full">
                      <img 
                        src={zoomImage} 
                        alt="Zoomed" 
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                        className="max-h-screen max-w-screen object-contain select-none" 
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