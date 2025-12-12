import { Trash, ChevronDown, ChevronUp, Edit } from "lucide-react"; // Import icon Edit
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCollectionStore } from "../stores/useCollectionStore";

const CollectionsList = () => {
  const {
    collections,
    fetchCollections,
    deleteCollection,
    removeProductFromCollection,
    setEditingCollection // ✅ Lấy hàm set edit từ store
  } = useCollectionStore();

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const toggleExpand = (i) => setExpandedIndex((prev) => (prev === i ? null : i));

  const handleDeleteAll = async () => {
    if (collections.length === 0) return alert("Không có bộ sưu tầm để xóa.");
    if (!confirm("⚠️ Bạn có chắc muốn xóa TẤT CẢ bộ sưu tầm?")) return;
    setDeletingAll(true);
    for (const col of collections) await deleteCollection(col._id);
    setDeletingAll(false);
    alert("✅ Đã xóa tất cả bộ sưu tầm");
  };

  return (
    <motion.div
      className="bg-white shadow-lg rounded-lg overflow-hidden max-w-5xl mx-auto border border-gray-200 p-4"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Danh sách bộ sưu tầm</h3>
        <button
          onClick={handleDeleteAll}
          disabled={deletingAll || collections.length === 0}
          className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${deletingAll || collections.length === 0 ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"}`}
        >
          <Trash size={14} /> Xóa tất cả
        </button>
      </div>

      <div className="space-y-4">
        {collections.length === 0 && <div className="text-center py-6 text-gray-500 italic">Chưa có bộ sưu tầm nào</div>}

        {collections.map((col, i) => (
          <div key={col._id} className="border rounded-lg p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
            {/* Ảnh thumbnail */}
            <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border bg-gray-200">
               {col.coverMedia?.type === "video" ? (
                 <video src={col.coverMedia?.url} className="w-full h-full object-cover" />
               ) : (
                 <img src={col.coverMedia?.url} alt={col.name} className="w-full h-full object-cover" />
               )}
            </div>

            <div className="flex-1 flex justify-between">
              <div>
                <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-gray-900">{col.name}</span>
                    {col.isSpecial && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded border border-yellow-200 font-bold">SPECIAL</span>}
                </div>
                
                <div className="text-xs text-gray-600 mt-1 line-clamp-1">{(col.description || "").slice(0, 80)}...</div>
                
                {/* Hiển thị thông số Size nhanh */}
                <div className="text-[10px] text-gray-400 mt-1 flex gap-2">
                    <span>{col.products?.length || 0} sản phẩm</span>
                    <span>•</span>
                    {col.isFullSize ? (
                        <span className="text-blue-600 font-medium">Full Size (Scale: {col.generalScale}%)</span>
                    ) : (
                        <span>Custom (PC: {col.desktopWidth}% - Mobile: {col.mobileWidth}%)</span>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* ✅ NÚT SỬA */}
                <button
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                  onClick={() => setEditingCollection(col)}
                  title="Chỉnh sửa thông tin"
                >
                  <Edit size={16} />
                </button>

                <button className="p-1.5 text-red-500 hover:bg-red-100 rounded-md" onClick={() => deleteCollection(col._id)} title="Xóa">
                  <Trash size={16} />
                </button>

                <button onClick={() => toggleExpand(i)} className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200">
                  {expandedIndex === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
          </div>
        ))}
        {/* ... (Phần expand sản phẩm giữ nguyên) ... */}
      </div>
    </motion.div>
  );
};

export default CollectionsList;