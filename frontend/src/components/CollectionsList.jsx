import { Trash, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCollectionStore } from "../stores/useCollectionStore";

const CollectionsList = () => {
  const {
    collections,
    fetchCollections,
    deleteCollection,
    removeProductFromCollection,
  } = useCollectionStore();

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const toggleExpand = (i) => {
    setExpandedIndex((prev) => (prev === i ? null : i));
  };

  // ✅ Hàm xóa tất cả bộ sưu tầm
  const handleDeleteAll = async () => {
    if (collections.length === 0) return alert("Không có bộ sưu tầm để xóa.");
    if (!confirm("⚠️ Bạn có chắc muốn xóa TẤT CẢ bộ sưu tầm?")) return;

    setDeletingAll(true);
    for (const col of collections) {
      try {
        await deleteCollection(col._id);
      } catch (err) {
        console.error(`❌ Lỗi khi xóa ${col.name}:`, err);
      }
    }
    setDeletingAll(false);
    alert("✅ Đã xóa tất cả bộ sưu tầm");
  };

  return (
    <motion.div
      className="bg-white shadow-lg rounded-lg overflow-hidden max-w-5xl mx-auto border border-gray-200 p-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Danh sách bộ sưu tầm
        </h3>

        {/* ✅ Nút Xóa tất cả */}
        <button
          onClick={handleDeleteAll}
          disabled={deletingAll || collections.length === 0}
          className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1
            ${
              deletingAll || collections.length === 0
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all duration-150"
            }`}
        >
          <Trash size={14} />
          {deletingAll ? "Đang xóa..." : "Xóa tất cả"}
        </button>
      </div>

      <div className="space-y-4">
        {collections.length === 0 && (
          <div className="text-center py-6 text-gray-500 italic">
            Chưa có bộ sưu tầm nào
          </div>
        )}

        {collections.map((col, i) => (
          <div
            key={col._id}
            className="border rounded-lg p-3 flex items-start gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border bg-gray-100"
            >
              {col.coverMedia?.type === "video" ? (
                <video
                  src={col.coverMedia?.url}
                  muted
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={col.coverMedia?.url}
                  alt={col.name}
                  className="w-full h-full object-cover"
                />
              )}
            </motion.div>

            <div className="flex-1 flex justify-between">
              <div>
                <div className="text-base font-semibold text-gray-900">
                  {col.name}
                </div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {(col.description || "").slice(0, 120)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {(col.products || []).length} sản phẩm
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="text-red-500 hover:text-red-400"
                  onClick={() => deleteCollection(col._id)}
                  title="Xóa bộ sưu tầm"
                >
                  <Trash size={16} />
                </button>

                <button
                  onClick={() => toggleExpand(i)}
                  className="p-1.5 bg-blue-50 rounded-md hover:bg-blue-100"
                  title={expandedIndex === i ? "Thu gọn" : "Mở rộng"}
                >
                  {expandedIndex === i ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {expandedIndex !== null && collections[expandedIndex] && (
          <div className="mt-3 border-t pt-3">
            {(collections[expandedIndex].products || []).length === 0 ? (
              <div className="text-xs text-gray-500 italic">
                Bộ sưu tầm chưa có sản phẩm
              </div>
            ) : (
              <div className="space-y-1.5">
                {collections[expandedIndex].products.map((p) => (
                  <motion.div
                    key={p._id}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between bg-gray-50 rounded-md px-2 py-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-8 h-10 object-cover rounded-md border"
                      />
                      <div className="max-w-[180px]">
                        <div className="font-medium text-gray-800 text-xs truncate">
                          {p.name}
                        </div>
                        {p.price && (
                          <div className="text-[10px] text-gray-500">
                            {p.price.toLocaleString()} ₫
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-400 text-[10px] px-1"
                      onClick={() =>
                        removeProductFromCollection(
                          collections[expandedIndex]._id,
                          p._id
                        )
                      }
                    >
                      Xóa
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CollectionsList;
