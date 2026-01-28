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
  const { searchProducts } = useProductStore();

  // Hàm debounce để tránh gọi API liên tục khi gõ
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      
      if (searchTerm.trim() === "") {
        // Nếu chưa nhập gì: Lấy gợi ý ngẫu nhiên (dùng lại logic PeopleAlsoBought)
        // API getRecommendedProducts đã lọc sẵn: feedback, sale, v.v ở Backend controller
        try {
          const res = await axios.get("/products/recommendations");
          setResults(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
          console.error("Lỗi lấy gợi ý:", error);
          setResults([]);
        }
      } else {
        // Nếu đã nhập: Gọi API tìm kiếm
        const products = await searchProducts(searchTerm);
        setResults(products || []);
      }
      
      setIsSearching(false);
    }, 500); // Delay 500ms sau khi ngừng gõ

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchProducts]);

  return (
    <div className="min-h-screen bg-white pt-24 px-4 max-w-7xl mx-auto">
      {/* Input Section */}
      <div className="flex justify-center mb-10">
        <div className="relative w-full max-w-xl">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition shadow-sm"
            autoFocus
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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