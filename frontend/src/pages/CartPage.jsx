import { Link, useNavigate } from "react-router-dom"; 
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore"; 
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, QrCode, CreditCard, X, CheckCircle } from "lucide-react";
import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import { useEffect, useState } from "react";
import toast from "react-hot-toast"; 

const CartPage = () => {
  const { cart, getCartItems, calculateTotals, placeOrder } = useCartStore(); 
  const { user, setShowUserBox } = useUserStore(); 
  const [rate, setRate] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false); 

  // --- STATE ---
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setRate(data.rates.VND))
      .catch((err) => console.error("Failed to fetch rate:", err));
  }, []);

  useEffect(() => {
    getCartItems(); 
    calculateTotals(); 
  }, [getCartItems, calculateTotals]);

  const totalUSD = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  let totalVND = null;
  if (rate != null) {
    const raw = totalUSD;
    totalVND = Math.floor(raw / 1000) * 1000; 
  }

  const handlePreOrder = () => {
    if (!user) {
        toast.error("Vui lòng đăng nhập để đặt hàng!");
        return;
    }
    if (!user.phoneNumber || !user.direction || !user.name) {
        toast.error("Vui lòng cập nhật đầy đủ thông tin giao hàng (SĐT, Địa chỉ)!");
        setShowUserBox(true); 
        return;
    }

    if (paymentMethod === "Chuyển khoản") {
        setShowQRModal(true); 
    } else {
        handleCartOrder(false); 
    }
  };

  const handleCartOrder = async (isPaid) => {
    setIsOrdering(true);
    
    const orderData = {
        products: cart.map(item => ({
            product: item._id,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
            size: item.size || "M" 
        })),
        totalAmount: totalUSD,
        isFromCart: true,
        note: "Đặt hàng từ Giỏ hàng",
        paymentMethod: paymentMethod, 
        isPaid: isPaid 
    };  

    const res = await placeOrder(orderData);
    setIsOrdering(false);
    setShowQRModal(false);
    
    if (res.success) {
        toast.success(isPaid ? "Xác nhận thanh toán thành công! Đơn hàng đang được xử lý." : "Đặt hàng thành công, Lunale sẽ liên hệ bạn sớm.");
    }
  };

  return (
    <div className="py-40 md:py-16 bg-white min-h-screen relative">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        
        <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8 relative">
          
          <motion.div
            className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {cart.length === 0 ? (
              <EmptyCartUI />
            ) : (
              <div className="space-y-6 pt-40" id="cart-content">
                {cart.map((item) => (
                  <CartItem key={item._id} item={item} />
                ))}
              </div>
            )}
          </motion.div>

          {cart.length > 0 && (
            <motion.div
              className="mt-10 lg:mt-40 w-full max-w-md lg:self-start"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="relative h-full">
                <div className="sticky top-32">
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Tóm tắt giỏ hàng
                    </h2>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Số lượng sản phẩm:</span>
                      <span className="font-medium">{totalItems} items</span>
                    </div>
                    
                    {totalVND && (
                      <div className="flex justify-between mb-4">
                        <span className="text-gray-600">Tổng cộng (VNĐ):</span>
                        <span className="font-bold text-blue-700">
                          {totalVND.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    )}

                    <div className="mb-4">
                        <label className="font-medium text-gray-700 block mb-2">Phương thức thanh toán:</label>
                        <div className="space-y-2">
                            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                <input type="radio" name="payment" className="w-4 h-4 text-blue-600" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                                <div className="flex items-center gap-2">
                                    <ShoppingCart size={18} className="text-gray-500"/>
                                    <span className="text-sm font-medium">Thanh toán khi nhận hàng (COD)</span>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'Chuyển khoản' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                <input type="radio" name="payment" className="w-4 h-4 text-blue-600" checked={paymentMethod === 'Chuyển khoản'} onChange={() => setPaymentMethod('Chuyển khoản')} />
                                <div className="flex items-center gap-2">
                                    <QrCode size={18} className="text-gray-500"/>
                                    <span className="text-sm font-medium">Chuyển khoản ngân hàng (QR)</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <Link
                      to="/contact"
                      className="block w-full text-center rounded-md bg-gray-100 text-gray-800 px-4 py-2 mb-3
                                 font-medium hover:bg-gray-200 transition"
                    >
                      Liên hệ hỏi hàng
                    </Link>

                    <button
                      onClick={handlePreOrder}
                      disabled={isOrdering}
                      className="block w-full text-center rounded-md bg-blue-600 px-4 py-2 
                                 font-bold text-white hover:bg-blue-700 active:scale-95 transition disabled:opacity-70"
                    >
                      {isOrdering ? "Đang xử lý..." : "Đặt Hàng Ngay"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {cart.length > 0 && (
            <div className="mt-16">
                 <PeopleAlsoBought excludeIds={cart.map((i) => i._id)} />
            </div>
        )}

        {/* --- MODAL QR CODE --- */}
        <AnimatePresence>
            {showQRModal && (
                <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative"
                    >
                        <button onClick={() => setShowQRModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-red-500">
                            <X size={24} />
                        </button>

                        <div className="p-6 text-center">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Thanh toán QR</h3>
                            <p className="text-sm text-gray-600 mb-4">Vui lòng quét mã bên dưới để thanh toán.</p>
                            
                            {/* 👇 SỬA CSS ẢNH Ở ĐÂY 👇 
                                w-full, max-w-[400px], h-auto để giữ tỷ lệ, object-contain
                            */}
                            <div className="border-2 border-blue-500 rounded-lg p-2 inline-block mb-4 max-w-full">
                                <img 
                                    src="/qr-payment.jpg"  // Bạn lưu ảnh là qr-payment.png vào public nhé
                                    alt="VietQR" 
                                    className="w-full max-w-[400px] h-auto object-contain mx-auto" 
                                />
                            </div>

                            <p className="font-bold text-lg text-blue-700 mb-6">
                                Tổng thanh toán: {totalVND ? totalVND.toLocaleString("vi-VN") : "..."} đ
                            </p>

                            <button 
                                onClick={() => handleCartOrder(true)} 
                                disabled={isOrdering}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition"
                            >
                                <CheckCircle size={20}/>
                                {isOrdering ? "Đang xử lý..." : "Tôi đã thanh toán"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default CartPage;

const EmptyCartUI = () => (
  <motion.div
    className="flex flex-col items-center justify-center space-y-4 py-26"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <ShoppingCart className="h-24 w-24 text-blue-300" />
    <h3 className="text-2xl font-semibold text-blue-900">Giỏ hàng trống</h3>
    <p className="text-gray-500">
      Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.
    </p>
    <Link
      className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
      to="/"
    >
      Tiếp tục mua sắm
    </Link>
  </motion.div>
);