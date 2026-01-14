import React, { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";

const AddToCartModal = ({ product, onClose }) => {
  const { addToCart } = useCartStore();
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleConfirm = async () => {
    setIsAdding(true);
    const result = await addToCart(product, size, quantity);
    setIsAdding(false);
    
    if (result.success) {
      toast.success(`Đã thêm ${quantity} sản phẩm (Size ${size}) vào giỏ!`);
      onClose();
    }
  };

  const increase = () => setQuantity(prev => prev + 1);
  const decrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  
  const originalPrice = Number(product.price) || 0;
  const percent = Number(product.salePercentage) || 0;
  const isSale = (product.isSale === true || product.isSale === "true" || product.isSale === 1) && percent > 0;
  const finalPrice = isSale ? originalPrice * (1 - percent / 100) : originalPrice;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Thêm vào giỏ hàng</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Info Sản phẩm */}
          <div className="flex gap-4">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-20 h-20 object-cover rounded-md border"
            />
            <div>
              <h4 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h4>
              <div className="mt-1">
                {isSale ? (
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">{finalPrice.toLocaleString()} ₫</span>
                    <span className="text-gray-400 text-xs line-through">{originalPrice.toLocaleString()} ₫</span>
                  </div>
                ) : (
                  <span className="text-gray-800 font-bold">{finalPrice.toLocaleString()} ₫</span>
                )}
              </div>
            </div>
          </div>

          {/* Chọn Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn kích thước (Size):</label>
            <div className="flex flex-wrap gap-2">
              {["S", "M", "L", "XL"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                    size === s 
                      ? "bg-black text-white border-black shadow-md" 
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Chọn Số lượng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng:</label>
            <div className="flex items-center gap-3">
              <button onClick={decrease} className="p-2 rounded-md border bg-gray-100 hover:bg-gray-200">
                <Minus size={16} />
              </button>
              <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
              <button onClick={increase} className="p-2 rounded-md border bg-gray-100 hover:bg-gray-200">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleConfirm}
            disabled={isAdding}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center"
          >
            {isAdding ? "Đang xử lý..." : `Thêm vào giỏ - ${(finalPrice * quantity).toLocaleString()} ₫`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddToCartModal;