import { Trash, ChevronDown, ChevronUp, Edit, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useCollectionStore } from "../stores/useCollectionStore";
import CreateCollectionForm from "./CreateCollectionForm"; // ✅ Import Form để nhúng vào popup

const CollectionsList = () => {
  const {
    collections,
    fetchCollections,
    fetchCollectionDetail,
    deleteCollection,
    removeProductFromCollection,
    setEditingCollection, // ✅ Lấy hàm set edit từ store
  } = useCollectionStore();

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  
  // ✅ State cho Popup chỉnh sửa
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Toggle mở rộng xem sản phẩm
  const toggleExpand = (i, id) => {
    if (expandedIndex === i) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(i);
      fetchCollectionDetail(id); // Gọi API lấy chi tiết sản phẩm
    }
  };

  // ✅ Hàm xử lý khi bấm nút Sửa
  const handleEditClick = (col) => {
    setEditingCollection(col); // 1. Lưu collection cần sửa vào Store
    setShowEditModal(true);    // 2. Mở Popup
  };

  // ✅ Hàm đóng Popup
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCollection(null); // Clear store khi đóng
  };

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
    <>
      <motion.div
        className="bg-white shadow-lg rounded-lg overflow-hidden max-w-5xl mx-auto border border-gray-200 p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Danh sách bộ sưu tầm
          </h3>

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
            <div key={col._id} className="border rounded-lg p-3 flex items-start gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border bg-gray-100"
              >
                {col.coverMedia?.type === "video" ? (
                  <video src={col.coverMedia?.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={col.coverMedia?.url} alt={col.name} className="w-full h-full object-cover" />
                )}
              </motion.div>

              <div className="flex-1 flex justify-between">
                <div>
                  <div className="text-base font-semibold text-gray-900">{col.name}</div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {(col.description || "").slice(0, 120)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {col.products ? `${col.products.length} sản phẩm` : "Bấm mở rộng để xem"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* ✅ NÚT SỬA */}
                  <button
                    className="text-blue-500 hover:text-blue-400 p-1.5 hover:bg-blue-50 rounded"
                    onClick={() => handleEditClick(col)}
                    title="Chỉnh sửa"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    className="text-red-500 hover:text-red-400 p-1.5 hover:bg-red-50 rounded"
                    onClick={() => deleteCollection(col._id)}
                    title="Xóa"
                  >
                    <Trash size={16} />
                  </button>

                  <button
                    onClick={() => toggleExpand(i, col._id)}
                    className="p-1.5 bg-gray-100 rounded hover:bg-gray-200"
                    title={expandedIndex === i ? "Thu gọn" : "Mở rộng"}
                  >
                    {expandedIndex === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Phần mở rộng xem sản phẩm */}
          {expandedIndex !== null && collections[expandedIndex] && (
            <div className="mt-3 border-t pt-3 pl-4">
              {!collections[expandedIndex].products ? (
                 <div className="text-sm text-gray-500 animate-pulse">⏳ Đang tải danh sách sản phẩm...</div>
              ) : collections[expandedIndex].products.length === 0 ? (
                <div className="text-xs text-gray-500 italic">Chưa có sản phẩm nào</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {collections[expandedIndex].products.map((p) => (
                    <motion.div key={p._id} className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                      <img src={p.image} className="w-8 h-10 object-cover rounded" />
                      <div className="overflow-hidden">
                         <p className="text-xs font-medium truncate w-32">{p.name}</p>
                         <button 
                           onClick={() => removeProductFromCollection(collections[expandedIndex]._id, p._id)}
                           className="text-[10px] text-red-500 hover:underline"
                         >
                           Gỡ bỏ
                         </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ✅ POPUP CHỈNH SỬA COLLECTION */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative"
            >
              {/* Nút đóng Popup */}
              <button 
                onClick={closeEditModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 bg-white rounded-full p-1 z-10"
              >
                <X size={24} />
              </button>

              {/* Form chỉnh sửa */}
              <div className="p-1">
                 {/* Truyền onCreate={closeEditModal} để khi sửa xong nó tự đóng modal */}
                 <CreateCollectionForm onCreate={closeEditModal} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CollectionsList;