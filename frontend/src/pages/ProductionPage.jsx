import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard";
import { ArrowLeft, Search } from "lucide-react";

const ProductionPage = () => {
  const navigate = useNavigate();
  const { fetchAllProducts, products, loading } = useProductStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const filteredProducts = products?.filter(
    (product) =>
      product.category?.toLowerCase() !== "feedback" &&
      product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-black text-teal-400 pt-24 pb-12">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/secret-dashboard")}
          className="flex items-center text-teal-400 hover:text-teal-300 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Quay lại Admin
        </button>

        <h1 className="text-4xl font-bold mb-10 text-center uppercase tracking-wider text-emerald-400">
          Danh Sách Sản Xuất
        </h1>

        <div className="relative max-w-xl mx-auto mb-12">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm cần sản xuất..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 bg-gray-900 border border-teal-800 rounded-lg focus:outline-none focus:border-teal-400 text-teal-300 placeholder-teal-700 transition-colors"
          />
          <Search className="absolute left-4 top-3.5 text-teal-600" size={20} />
        </div>

        {loading ? (
          <h2 className="text-center text-teal-600 text-xl">Đang tải dữ liệu...</h2>
        ) : filteredProducts.length === 0 ? (
          <h2 className="text-center text-teal-600 text-xl">Không tìm thấy sản phẩm nào.</h2>
        ) : (
          <div className="flex justify-center">
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10 justify-items-center w-fit px-3 sm:px-4 md:px-6 lg:px-0 mx-auto"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {filteredProducts.map((product) => (
                <motion.div
                  key={product._id}
                  variants={cardVariants}
                  className="w-full flex justify-center cursor-pointer transform hover:scale-105 transition-transform duration-300"
                  onClick={() => navigate(`/admin/production/${product._id}`)}
                >
                  <div className="w-[160px] sm:w-[200px] md:w-[230px] lg:w-[270px] pointer-events-none">
                    <ProductCard
                      product={{
                        ...product,
                        image: product.image || "/placeholder.png",
                      }}
                      variant="category"
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionPage;