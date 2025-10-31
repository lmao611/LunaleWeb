import React, { useState } from "react";
import { useUserStore } from "../stores/useUserStore";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const ContactModal = ({ product, onClose }) => {
  const { user, setShowUserBox } = useUserStore(); // ✅ thêm
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);

  const handleCopy = () => {
    if (!user) {
      toast.error("⚠️ Vui lòng đăng nhập để sao chép thông tin!");
      return;
    }

    // Kiểm tra thiếu thông tin
    if (!user.name || !user.phoneNumber || !user.direction) {
      toast.custom(
        (t) => (
          <div className="bg-white shadow-md rounded-lg p-4 text-sm">
            <p className="text-gray-800 mb-2">
              ⚠️ Bạn cần điền đầy đủ <b>Họ tên, SĐT và Địa chỉ</b> trước khi liên hệ mua hàng.
            </p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setShowUserBox(true); // ✅ Mở hộp thông tin Navbar
              }}
              className="bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition"
            >
              Điền ngay
            </button>
          </div>
        ),
        { duration: 5000 }
      );
      return;
    }

    const message = `- Họ tên: ${user?.name}
- SĐT: ${user?.phoneNumber}
- Địa chỉ: ${user?.direction}
- Tên sản phẩm: ${product?.name || "Không có tên"}
- Link: ${window.location.href}
- Size: ${size}
- Số lượng: ${quantity}
Tôi muốn mua sản phẩm này.`;

    navigator.clipboard
      .writeText(message)
      .then(() =>
        toast.success("✅ Đã sao chép nội dung! Dán vào tin nhắn Facebook nhé.")
      )
      .catch(() => toast.error("Không thể sao chép nội dung!"));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X />
        </button>
        <h2 className="text-xl font-bold mb-4">
          Liên hệ mua: {product?.name || "Không có tên"}
        </h2>
        <div className="space-y-4">
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Chọn size</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Số lượng"
          />
          <button
            onClick={handleCopy}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Sao chép nội dung liên hệ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
