import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react"; // Thêm icon X để xóa nhanh
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom"; // Hook để thao tác URL

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  
  // State input chỉ để hiển thị chữ đang gõ, tách biệt với việc gọi API
  const [inputValue, setInputValue] = useState(initialQuery);
  
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchProducts = useProductStore((state) => state.searchProducts);
  
  // Dùng useRef để giữ timeout giữa các lần render (tránh tạo biến mới)
  const debounceRef = useRef(null);

  // 1. Hàm xử lý khi người dùng gõ
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value); // Cập nhật giao diện ngay lập tức cho mượt

    // Clear timeout cũ nếu người dùng gõ tiếp (cơ chế Debounce)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Thiết lập timeout mới: Đợi 500ms sau khi ngừng gõ mới chạy logic
    debounceRef.current = setTimeout(() => {
      // Cập nhật URL mà KHÔNG reload trang
      if (value.trim()) {
        setSearchParams({ query: value });
      } else {
        setSearchParams({}); // Xóa query param nếu ô trống
      }
    }, 500);
  };

  // 2. useEffect lắng nghe sự thay đổi của URL (query) để gọi API
  // Logic: URL thay đổi -> Gọi API. Giúp hỗ trợ cả nút Back/Forward trình duyệt.
  useEffect(() => {
    const query = searchParams.get("query") || "";

    const fetchData = async () => {
      setIsSearching(true);
      try {
        if (query.trim()) {
          // Có từ khóa -> Tìm kiếm
          const products = await searchProducts(query);
          setResults(products || []);
        } else {
          // Không từ khóa -> Gợi ý ngẫu nhiên
          const res = await axios.get("/products/recommendations");
          setResults(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchData();

    // Cleanup khi component unmount
    return () => {
      setIsSearching(false);
    };
  }, [searchParams, searchProducts]); // Chỉ chạy lại khi URL thay đổi

  // Hàm xóa nhanh nội dung tìm kiếm
  const clearSearch = () => {
    setInputValue("");
    setSearchParams({});
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  return (
    <div className="min-h-screen bg-white pt-24 px-4 max-w-7xl mx-auto">
      {/* Input Section */}
      <div className="flex justify-center mb-10">
        {/* QUAN TRỌNG: Dùng thẻ div thay vì form để chặn tuyệt đối việc reload */}
        <div className="relative w-full max-w-xl group">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={inputValue}
            onChange={handleInputChange}
            className="w-full pl-12 pr-10 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition shadow-sm bg-gray-50 focus:bg-white"
            autoFocus
          />
          
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition" 
            size={20} 
          />
          
          {inputValue && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Title Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {!searchParams.get("query") ? "Gợi ý cho bạn" : `Kết quả cho: "${searchParams.get("query")}"`}
        </h2>
        {results.length === 0 && !isSearching && searchParams.get("query") && (
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