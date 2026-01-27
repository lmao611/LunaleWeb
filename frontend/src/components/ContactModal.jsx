import React, { useState } from "react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore"; 
import { X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const ContactModal = ({ product, onClose }) => {
  const { user, setShowUserBox } = useUserStore();
  const { placeOrder } = useCartStore(); 
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  // State mới cho phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState("COD"); 
  const [isOrdering, setIsOrdering] = useState(false);

  const handleCopy = () => {
    if (!user) return toast.error("⚠️ Vui lòng đăng nhập!");
    if (!user.name || !user.phoneNumber || !user.direction) {
      toast.error("Vui lòng cập nhật thông tin cá nhân trước!");
      setShowUserBox(true);
      return;
    }
    const message = `- Họ tên: ${user?.name}\n- SĐT: ${user?.phoneNumber}\n- Địa chỉ: ${user?.direction}\n- Tên sản phẩm: ${product?.name}\n- Link: ${window.location.href}\n- Size: ${size}\n- Số lượng: ${quantity}\n- Thanh toán: ${paymentMethod}\nTôi muốn mua sản phẩm này.`;
    navigator.clipboard.writeText(message).then(() => toast.success("✅ Đã sao chép nội dung!"));
  };

  const handlePlaceOrder = async () => {
    if (!user) return toast.error("⚠️ Vui lòng đăng nhập!");
    if (!user.name || !user.phoneNumber || !user.direction) {
      toast.error("Vui lòng cập nhật thông tin cá nhân (SĐT/Địa chỉ)!");
      setShowUserBox(true);
      return;
    }

    setIsOrdering(true);
    const orderData = {
      products: [{
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: Number(quantity),
        size: size
      }],
      totalAmount: product.price * Number(quantity),
      paymentMethod: paymentMethod, // Gửi phương thức thanh toán lên server
      isFromCart: false, 
      note: "Đặt hàng nhanh từ trang chi tiết"
    };

    const result = await placeOrder(orderData);
    setIsOrdering(false);

    if (result.success) {
      toast.success("🎉 Đặt hàng thành công! Shop sẽ liên hệ sớm.");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-black"><X /></button>
        <h2 className="text-xl font-bold mb-4">Liên hệ mua: {product?.name}</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="">Chọn size</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
            </select>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Số lượng" />
          </div>

          {/* Chọn phương thức thanh toán */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
            <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)} 
                className="w-full border rounded px-3 py-2"
            >
                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                <option value="Chuyển khoản">Chuyển khoản ngân hàng</option>
                <option value="Tiền mặt">Tiền mặt</option>
            </select>
          </div>
          
          <button onClick={handleCopy} className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 font-medium">
            Sao chép
          </button>

          <button 
            onClick={handlePlaceOrder} 
            disabled={isOrdering}
            className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-700 font-bold flex justify-center items-center gap-2"
          >
            {isOrdering ? "Đang xử lý..." : "Đặt Hàng Ngay"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ContactModal;