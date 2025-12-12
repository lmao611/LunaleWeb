import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Loader, Star, Layout, Maximize2, MoveVertical } from "lucide-react";
import { useCollectionStore } from "../stores/useCollectionStore";

const CreateCollectionForm = () => {
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
    media: "",
    gradientFrom: "#3b82f6", 
    gradientTo: "#06b6d4",
    isSpecial: false,
    specialPosition: "below_banner",
    isFullSize: false,
    displayHeight: 500, // Default height
  });
  const [loading, setLoading] = useState(false);
  const { createCollection } = useCollectionStore();

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewCollection({ ...newCollection, media: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await createCollection({
      name: newCollection.name,
      description: newCollection.description,
      coverMedia: {
        url: newCollection.media,
        type: newCollection.media.startsWith("data:video") ? "video" : "image",
      },
      gradientFrom: newCollection.gradientFrom,
      gradientTo: newCollection.gradientTo,
      isSpecial: newCollection.isSpecial,
      specialPosition: newCollection.specialPosition,
      isFullSize: newCollection.isFullSize,
      displayHeight: newCollection.displayHeight,
    });
    // Reset form
    setNewCollection({
      name: "",
      description: "",
      media: "",
      gradientFrom: "#3b82f6",
      gradientTo: "#06b6d4",
      isSpecial: false,
      specialPosition: "below_banner",
      isFullSize: false,
      displayHeight: 500,
    });
    setLoading(false);
  };

  // Component con để render phần Media Input
  const MediaInputSection = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Ảnh hoặc video minh họa
      </label>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleMediaChange}
        className="mt-2"
      />
      {newCollection.media && (
        <div className="mt-3">
          {newCollection.media.startsWith("data:video") ? (
            <video
              src={newCollection.media}
              controls
              className="w-full rounded-lg shadow-sm border"
              style={{ maxHeight: "300px", objectFit: "cover" }}
            />
          ) : (
            <img
              src={newCollection.media}
              alt="preview"
              className="w-full h-48 object-cover rounded-lg shadow-sm border"
            />
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-md rounded-lg p-8 mb-8 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-blue-700">
        Tạo bộ sưu tầm mới
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700">Tên bộ sưu tầm</label>
          <input
            type="text"
            value={newCollection.name}
            onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
            className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            rows="3"
            value={newCollection.description}
            onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
            className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* --- SPECIAL COLLECTION SECTION --- */}
        <div className="p-4 border border-blue-100 bg-blue-50 rounded-md space-y-4">
            {/* Toggle Special */}
            <div className="flex items-center gap-3 cursor-pointer" 
                 onClick={() => setNewCollection({...newCollection, isSpecial: !newCollection.isSpecial})}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newCollection.isSpecial ? "bg-yellow-500 border-yellow-500" : "bg-white border-gray-300"}`}>
                    {newCollection.isSpecial && <Star size={12} className="text-white fill-current" />}
                </div>
                <div>
                    <span className="block text-sm font-bold text-gray-800">Đây là Special Collection?</span>
                    <span className="block text-xs text-gray-500">Kích hoạt để tùy chỉnh vị trí và kích thước hiển thị.</span>
                </div>
            </div>

            {/* Configs chỉ hiện khi là Special */}
            {newCollection.isSpecial && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pl-8 space-y-4 border-l-2 border-blue-200 ml-2.5"
                >
                    {/* Position */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            <Layout size={14} /> Vị trí hiển thị:
                        </label>
                        <select
                            value={newCollection.specialPosition}
                            onChange={(e) => setNewCollection({ ...newCollection, specialPosition: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-1.5 px-2 bg-white text-sm"
                        >
                            <option value="below_banner">Ngay dưới Banner</option>
                            <option value="below_categories">Dưới Danh mục</option>
                            <option value="below_featured">Dưới Sản phẩm nổi bật</option>
                        </select>
                    </div>

                    {/* Full Size Toggle */}
                    <div className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setNewCollection({...newCollection, isFullSize: !newCollection.isFullSize})}>
                         <div className={`w-4 h-4 rounded border flex items-center justify-center ${newCollection.isFullSize ? "bg-blue-600 border-blue-600" : "bg-white border-gray-400"}`}>
                            {newCollection.isFullSize && <Maximize2 size={10} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">Full Size (Hiển thị toàn bộ ảnh gốc)</span>
                    </div>

                    {/* Size Edit (Height) Slider */}
                    <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                             <span className="flex items-center gap-1"><MoveVertical size={12}/> Size Edit (Chiều cao):</span>
                             <span className="font-bold">{newCollection.displayHeight}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="300" 
                            max="1000" 
                            step="10"
                            value={newCollection.displayHeight}
                            onChange={(e) => setNewCollection({...newCollection, displayHeight: Number(e.target.value)})}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                            *Điều chỉnh chiều cao khung hiển thị trên Homepage.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>

        {/* --- Gradient Config --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gradient tên bộ sưu tầm</label>
          <div className="flex items-center gap-4">
            <input type="color" value={newCollection.gradientFrom} onChange={(e) => setNewCollection({...newCollection, gradientFrom: e.target.value})} className="w-12 h-10 rounded cursor-pointer border" />
            <input type="color" value={newCollection.gradientTo} onChange={(e) => setNewCollection({...newCollection, gradientTo: e.target.value})} className="w-12 h-10 rounded cursor-pointer border" />
          </div>
          <div className="mt-2 text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${newCollection.gradientFrom}, ${newCollection.gradientTo})` }}>
            {newCollection.name || "Xem thử gradient"}
          </div>
        </div>

        {/* ✅ LOGIC MỚI: 
            Nếu KHÔNG phải Special -> Hiện input media ở đây.
            Nếu LÀ Special -> Hiện input media ở cuối form (bên dưới đoạn này).
        */}
        {!newCollection.isSpecial && <MediaInputSection />}

        {newCollection.isSpecial && (
            <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-800 mb-2">Hình minh họa (Hiển thị cuối trang tạo)</p>
                <MediaInputSection />
            </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium 
          text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-blue-500 disabled:opacity-50 mt-6"
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" /> Đang tạo...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5" /> Tạo bộ sưu tầm
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateCollectionForm;