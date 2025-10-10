import { useEffect, useState } from "react";
import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useNavigate } from "react-router-dom";

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCartStore();
  const [rate, setRate] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setRate(data.rates.VND))
      .catch((err) => console.error("Failed to fetch rate:", err));
  }, []);

  const decrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item._id, item.quantity - 1);
    }
  };

  const increase = () => {
    updateQuantity(item._id, item.quantity + 1);
  };

  let vndDisplay = "";
  if (rate != null) {
    const raw = item.price * rate * item.quantity;
    const rounded = Math.floor(raw / 1000) * 1000; 
    vndDisplay = rounded.toLocaleString("vi-VN") + " ₫";
  }

  return (
    <div
      className="rounded-lg border p-4 shadow-sm border-gray-200 bg-white md:p-6 
                 cursor-pointer transition transform hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg"
      onClick={() => navigate(`/product/${item._id}`)} 
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="shrink-0">
          <img
            className="w-24 h-24 md:h-32 rounded object-cover"
            src={item.image}
            alt={item.name}
            onError={(e) =>
              (e.target.src =
                "https://via.placeholder.com/150x150?text=No+Image")
            }
          />
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-base font-medium text-gray-800">{item.name}</p>
          <p className="text-sm text-gray-500">{item.description}</p>
          <button
            className="inline-flex items-center text-sm font-medium text-red-500 
             hover:text-red-700 hover:underline"
            onClick={(e) => {
              e.stopPropagation(); 
              removeFromCart(item._id);
            }}
          >
            <Trash className="w-4 h-4 mr-1" /> Xóa
          </button>
        </div>

        <div
          className="flex flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border
               border-gray-300 bg-white hover:bg-blue-100 focus:outline-none 
               focus:ring-2 focus:ring-blue-500"
              onClick={decrease}
            >
              <Minus className="text-blue-600 w-4 h-4" />
            </button>
            <p className="px-2 font-medium">{item.quantity}</p>
            <button
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border
               border-gray-300 bg-white hover:bg-blue-100 focus:outline-none 
               focus:ring-2 focus:ring-blue-500"
              onClick={increase}
            >
              <Plus className="text-blue-600 w-4 h-4" />
            </button>
          </div>


          <p className="text-base font-bold text-blue-700">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
          {vndDisplay && (
            <p className="text-sm text-gray-500">{vndDisplay}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;
