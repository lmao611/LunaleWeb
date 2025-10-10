import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { useCollectionStore } from "../stores/useCollectionStore";

const CollectionDetailPage = () => {
  const { id } = useParams();
  const { collections, fetchCollections, isLoading } = useCollectionStore();

  useEffect(() => {
    if (!collections || collections.length === 0) {
      fetchCollections();
    }
  }, [fetchCollections, collections]);

  const collection = collections.find((c) => c._id === id);

  if (isLoading)
    return (
      <div className="text-center py-20 text-gray-600">
        Đang tải bộ sưu tầm...
      </div>
    );

  if (!collection)
    return (
      <div className="text-center py-20 text-gray-600">
        Không tìm thấy bộ sưu tầm
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-32 px-6 max-w-7xl mx-auto">
      {/* --- Tiêu đề --- */}
      <div className="text-center mb-12">
        <h1
          className={`text-5xl font-extrabold tracking-tight bg-gradient-to-r ${
            collection.gradient || "from-blue-500 to-cyan-500"
          } bg-clip-text text-transparent mb-4`}
        >
          {collection.name}
        </h1>
        <hr className="w-24 mx-auto border-t-4 border-blue-600 mb-6 rounded-full" />
        {/* <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
          {collection.description}
        </p> */}
      </div>

      {/* --- Danh sách sản phẩm --- */}
      {collection.products && collection.products.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {collection.products.map((p) => (
            <ProductCard key={p._id} product={p} variant="category" />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 italic">
          Bộ sưu tầm này chưa có sản phẩm nào.
        </p>
      )}

      {/* --- Nút quay lại --- */}
      <div className="text-center mt-12">
        <Link
          to="/"
          className="inline-block text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
        >
          ← Quay về Trang Chủ
        </Link>
      </div>
    </div>
  );
};

export default CollectionDetailPage;
