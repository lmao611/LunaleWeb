import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import { useEffect, useState } from "react";

const CartPage = () => {
  const { cart, getCartItems, calculateTotals } = useCartStore();
  const [rate, setRate] = useState(null);


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
    const raw = totalUSD * rate;
    totalVND = Math.floor(raw / 1000) * 1000; 
  }

  return (
    <div className="py-40 md:py-16 bg-white min-h-screen">
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
              <div
                className="space-y-6 pt-40"
                id="cart-content"
                style={{ position: "relative" }}
              >
                {cart.map((item) => (
                  <CartItem key={item._id} item={item} />
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <PeopleAlsoBought excludeIds={cart.map((i) => i._id)} />
            )}
          </motion.div>

          {cart.length > 0 && (
            <motion.div
              className="mt-40 lg:mt-40 w-full max-w-md lg:self-start"
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
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Tổng cộng (USD):</span>
                      <span className="font-bold text-blue-700">
                        ${totalUSD.toFixed(2)}
                      </span>
                    </div>
                    {totalVND && (
                      <div className="flex justify-between mb-4">
                        <span className="text-gray-600">Tổng cộng (VNĐ):</span>
                        <span className="font-bold text-blue-700">
                          {totalVND.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    )}

                    <Link
                      to="/contact"
                      className="block w-full text-center rounded-md bg-blue-600 px-4 py-2 
                                 font-medium text-white hover:bg-blue-700 active:scale-95 transition"
                    >
                      Liên hệ mua hàng
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
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
