import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import axios from "../lib/axios";
import { motion } from "framer-motion";

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Chỉ lấy hàm searchProducts, không lấy state để tránh re-render thừa
  const searchProducts = useProductStore((state) => state.searchProducts);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Nếu có từ khóa mới bắt đầu loading
      if (searchTerm.trim() !== "") {
          setIsSearching(true);
      }
      
      if (searchTerm.trim() === "") {
        try {
          // Lấy gợi ý (API recommendations đã lọc feedback/sale)
          const res = await axios.get("/products/recommendations");
          setResults(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
          console.error("Lỗi lấy gợi ý:", error);
          setResults([]);
        } finally {
            setIsSearching(false);
        }
      } else {
        // Gọi API tìm kiếm
        try {
            const products = await searchProducts(searchTerm);
            setResults(products || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchProducts]);

  return (
    <div className="min-h-screen bg-white pt-24 px-4 max-w-7xl mx-auto">
      {/* Input Section */}
      <div className="flex justify-center mb-10">
        {/* ❌ Đã thay thẻ form bằng thẻ div để chặn tuyệt đối việc reload */}
        <div className="relative w-full max-w-xl">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition shadow-sm"
            autoFocus 
          />
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Title Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {searchTerm.trim() === "" ? "Gợi ý cho bạn" : `Kết quả tìm kiếm: "${searchTerm}"`}
        </h2>
        {results.length === 0 && !isSearching && searchTerm.trim() !== "" && (
          <p className="text-gray-500 mt-2">Không tìm thấy sản phẩm nào phù hợp.</p>
        )}
      </div>

      {/* Results Grid */}
      {isSearching ? (
        <LoadingSpinner />
      ) : (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10"
        >
          {results.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default SearchPage;