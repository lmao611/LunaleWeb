import React, { useState } from "react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore"; // Import thêm
import { X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const ContactModal = ({ product, onClose }) => {
  const { user, setShowUserBox } = useUserStore();
  const { placeOrder } = useCartStore(); // Lấy hàm đặt hàng
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);

  // Hàm sao chép cũ (GIỮ NGUYÊN)
  const handleCopy = () => {
    if (!user) return toast.error("⚠️ Vui lòng đăng nhập!");
    if (!user.name || !user.phoneNumber || !user.direction) {
      toast.error("Vui lòng cập nhật thông tin cá nhân trước!");
      setShowUserBox(true);
      return;
    }
    const message = `- Họ tên: ${user?.name}\n- SĐT: ${user?.phoneNumber}\n- Địa chỉ: ${user?.direction}\n- Tên sản phẩm: ${product?.name}\n- Link: ${window.location.href}\n- Size: ${size}\n- Số lượng: ${quantity}\nTôi muốn mua sản phẩm này.`;
    navigator.clipboard.writeText(message).then(() => toast.success("✅ Đã sao chép nội dung!"));
  };

  // 👇 HÀM MỚI: Đặt hàng trực tiếp
  const handlePlaceOrder = async () => {
    if (!user) return toast.error("⚠️ Vui lòng đăng nhập!");
    if (!user.name || !user.phoneNumber || !user.direction) {
      toast.error("Vui lòng cập nhật thông tin cá nhân (SĐT/Địa chỉ)!");
      setShowUserBox(true);
      return;
    }

    setIsOrdering(true);
    // Chuẩn bị dữ liệu gửi lên server
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
      isFromCart: false, // Mua lẻ
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
          <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="">Chọn size</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Số lượng" />
          
          {/* Nút Sao Chép Cũ */}
          <button onClick={handleCopy} className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 font-medium">
            Sao chép nội dung tin nhắn
          </button>

          {/* 👇 Nút Đặt Hàng Mới */}
          <button 
            onClick={handlePlaceOrder} 
            disabled={isOrdering}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold flex justify-center items-center gap-2"
          >
            {isOrdering ? "Đang xử lý..." : "Đặt Hàng Ngay (Lưu hệ thống)"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ContactModal;