import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard";
import axios from "../lib/axios";
import { motion } from "framer-motion";

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  
  const searchProducts = useProductStore((state) => state.searchProducts);

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get("/products/recommendations");
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setResults([]);
    }
  };

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      fetchRecommendations();
      return;
    }

    try {
      const products = await searchProducts(value);
      setResults(products || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="min-h-screen bg-white pt-24 px-4 max-w-7xl mx-auto">
      <div className="flex justify-center mb-10">
        <div className="relative w-full max-w-xl group">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={handleInputChange}
            className="w-full pl-12 pr-10 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition shadow-sm bg-gray-50 focus:bg-white"
            autoFocus
          />
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition" 
            size={20} 
          />
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(""); fetchRecommendations(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 rounded-full transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {searchTerm.trim() === "" ? "Gợi ý cho bạn" : `Kết quả: "${searchTerm}"`}
        </h2>
        {results.length === 0 && searchTerm.trim() !== "" && (
          <p className="text-gray-500 mt-2">Không tìm thấy sản phẩm nào.</p>
        )}
      </div>

      <motion.div 
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10"
      >
        {results.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </motion.div>
    </div>
  );
};

export default SearchPage;