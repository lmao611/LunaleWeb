import { useState, useEffect } from "react";
import { motion } from "framer-motion"; // Cần import AnimatePresence nếu muốn hiệu ứng mượt
import { PlusCircle, Loader, Star, Layout, Monitor, Smartphone, EyeOff, Save, X, Maximize, UploadCloud } from "lucide-react";
import { useCollectionStore } from "../stores/useCollectionStore";

const CreateCollectionForm = () => {
  const { createCollection, updateCollection, editingCollection, setEditingCollection } = useCollectionStore();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    media: "",
    mediaType: "image",
    gradientFrom: "#3b82f6", 
    gradientTo: "#06b6d4",
    isSpecial: false,
    specialPosition: "below_banner",
    
    // Config hiển thị
    isFullSize: false,   
    // Bỏ generalScale vì giờ ta dùng desktopWidth/mobileWidth để chỉnh riêng
    
    desktopWidth: 100,
    desktopHeight: 600,
    mobileWidth: 100,
    mobileHeight: 400,

    hideName: false,
    hideDescription: false,
  });
  
  const [previewMode, setPreviewMode] = useState("desktop"); // 'desktop' | 'mobile'
  const [loading, setLoading] = useState(false);

  // ✅ EFFECT: Tự động điền form
  useEffect(() => {
    if (editingCollection) {
      setFormData({
        name: editingCollection.name || "",
        description: editingCollection.description || "",
        media: editingCollection.coverMedia?.url || "",
        mediaType: editingCollection.coverMedia?.type || "image",
        gradientFrom: editingCollection.gradientFrom || "#3b82f6",
        gradientTo: editingCollection.gradientTo || "#06b6d4",
        isSpecial: editingCollection.isSpecial || false,
        specialPosition: editingCollection.specialPosition || "below_banner",
        
        isFullSize: editingCollection.isFullSize || false,

        desktopWidth: editingCollection.desktopWidth || 100,
        desktopHeight: editingCollection.desktopHeight || 600,
        mobileWidth: editingCollection.mobileWidth || 100,
        mobileHeight: editingCollection.mobileHeight || 400,

        hideName: editingCollection.hideName || false,
        hideDescription: editingCollection.hideDescription || false,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingCollection]);

  const handleReset = () => {
    setFormData({
      name: "", description: "", media: "", mediaType: "image",
      gradientFrom: "#3b82f6", gradientTo: "#06b6d4",
      isSpecial: false, specialPosition: "below_banner",
      isFullSize: false,
      desktopWidth: 100, desktopHeight: 600,
      mobileWidth: 100, mobileHeight: 400,
      hideName: false, hideDescription: false,
    });
    setEditingCollection(null);
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const isVideo = file.type.startsWith("video");
      setFormData({ 
        ...formData, 
        media: reader.result,
        mediaType: isVideo ? "video" : "image"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      description: formData.description,
      coverMedia: {
        url: formData.media,
        type: formData.mediaType,
      },
      gradientFrom: formData.gradientFrom,
      gradientTo: formData.gradientTo,
      isSpecial: formData.isSpecial,
      specialPosition: formData.specialPosition,
      
      isFullSize: formData.isFullSize,
      // generalScale: bỏ, thay bằng width riêng bên dưới

      desktopWidth: Number(formData.desktopWidth),
      desktopHeight: Number(formData.desktopHeight),
      mobileWidth: Number(formData.mobileWidth),
      mobileHeight: Number(formData.mobileHeight),

      hideName: formData.hideName,
      hideDescription: formData.hideDescription,
    };

    try {
      if (editingCollection) {
        await updateCollection(editingCollection._id, payload);
      } else {
        await createCollection(payload);
      }
      handleReset();
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const MediaInputSection = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700">Ảnh/Video minh họa</label>
      <div className="mt-2 flex items-center gap-4">
        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition">
           <UploadCloud size={18}/> Chọn file
           <input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden"/>
        </label>
        {formData.media && <span className="text-xs text-green-600 font-bold">Đã chọn file</span>}
      </div>
      
      {formData.media && (
        <div className="mt-3 relative group rounded-lg overflow-hidden border border-gray-300">
          {formData.mediaType === "video" ? (
            <video src={formData.media} controls className="w-full max-h-[200px] object-cover" />
          ) : (
            <img src={formData.media} alt="preview" className="w-full h-32 object-cover" />
          )}
        </div>
      )}
    </div>
  );

  // --- FORM CONTENT ---
  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
       {/* Tên & Màu */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Tên bộ sưu tầm</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu Gradient</label>
                <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={formData.gradientFrom} onChange={(e) => setFormData({...formData, gradientFrom: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <span className="text-gray-400">to</span>
                    <input type="color" value={formData.gradientTo} onChange={(e) => setFormData({...formData, gradientTo: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0" />
                </div>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500" required />
        </div>

        {/* --- SPECIAL SECTION --- */}
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-4">
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setFormData({...formData, isSpecial: !formData.isSpecial})}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.isSpecial ? "bg-yellow-400 border-yellow-400" : "bg-white border-gray-300"}`}>
                    {formData.isSpecial && <Star size={12} className="text-white fill-current" />}
                </div>
                <span className="font-bold text-gray-800 text-sm">Cài đặt hiển thị đặc biệt (Banner/QC)</span>
            </div>

            {formData.isSpecial && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-2 space-y-5 pt-2">
                    {/* Vị trí & Ẩn hiện */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Vị trí hiển thị:</label>
                            <select value={formData.specialPosition} onChange={(e) => setFormData({ ...formData, specialPosition: e.target.value })} className="w-full border border-gray-300 rounded py-1.5 px-2 text-sm">
                                <option value="below_banner">Dưới Banner</option>
                                <option value="below_categories">Dưới Danh mục</option>
                                <option value="below_featured">Dưới Sản phẩm nổi bật</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-2 pb-1">
                             <button type="button" onClick={() => setFormData({...formData, hideName: !formData.hideName})} 
                                className={`px-2 py-1.5 rounded text-xs font-bold border flex items-center gap-1 ${formData.hideName ? "bg-red-100 border-red-300 text-red-600" : "bg-white border-gray-300 text-gray-500"}`}>
                                <EyeOff size={12}/> Giấu Tên
                             </button>
                             <button type="button" onClick={() => setFormData({...formData, hideDescription: !formData.hideDescription})} 
                                className={`px-2 py-1.5 rounded text-xs font-bold border flex items-center gap-1 ${formData.hideDescription ? "bg-red-100 border-red-300 text-red-600" : "bg-white border-gray-300 text-gray-500"}`}>
                                <EyeOff size={12}/> Giấu Mô Tả
                             </button>
                        </div>
                    </div>

                    <hr className="border-blue-200" />

                    {/* --- CẤU HÌNH SIZE --- */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2"><Layout size={14}/> Cấu hình hiển thị</h3>
                            
                            {/* Toggle Full Size */}
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({...formData, isFullSize: !formData.isFullSize})}>
                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${formData.isFullSize ? "bg-blue-600" : "bg-gray-300"}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${formData.isFullSize ? "translate-x-4" : "translate-x-0"}`}></div>
                                </div>
                                <span className={`text-xs font-bold ${formData.isFullSize ? "text-blue-600" : "text-gray-500"}`}>Chế độ Full Size</span>
                            </div>
                        </div>

                        {/* ✅ GIAO DIỆN CHỈNH SIZE (DESKTOP & MOBILE RIÊNG) */}
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                {/* Tabs Chuyển đổi Desktop/Mobile */}
                                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 w-fit">
                                    <button type="button" onClick={() => setPreviewMode("desktop")} 
                                        className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all ${previewMode === "desktop" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                                        <Monitor size={14}/> Desktop
                                    </button>
                                    <button type="button" onClick={() => setPreviewMode("mobile")} 
                                        className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all ${previewMode === "mobile" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                                        <Smartphone size={14}/> Mobile
                                    </button>
                                </div>

                                {/* Inputs dựa theo Mode */}
                                <div className={`p-4 rounded-lg border transition-all ${previewMode === "desktop" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"}`}>
                                    {previewMode === "desktop" ? (
                                        // --- DESKTOP CONFIG ---
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                                    <span>Độ rộng Desktop (%)</span> 
                                                    <span className="text-blue-600">{formData.desktopWidth}%</span>
                                                </div>
                                                <input type="range" min="20" max="150" step="5" value={formData.desktopWidth} onChange={(e)=>setFormData({...formData, desktopWidth: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg cursor-pointer accent-blue-600" />
                                            </div>
                                            
                                            {/* Chỉ hiện chỉnh chiều cao nếu KHÔNG phải Full Size */}
                                            {!formData.isFullSize && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Chiều cao (px):</span>
                                                    <input type="number" min="100" max="2000" value={formData.desktopHeight} onChange={(e)=>setFormData({...formData, desktopHeight: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                                </div>
                                            )}
                                            {formData.isFullSize && <p className="text-[10px] text-gray-500 italic">* Chiều cao tự động theo tỷ lệ ảnh gốc (Full Size)</p>}
                                        </div>
                                    ) : (
                                        // --- MOBILE CONFIG ---
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                                    <span>Độ rộng Mobile (%)</span> 
                                                    <span className="text-green-600">{formData.mobileWidth}%</span>
                                                </div>
                                                <input type="range" min="20" max="150" step="5" value={formData.mobileWidth} onChange={(e)=>setFormData({...formData, mobileWidth: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg cursor-pointer accent-green-600" />
                                            </div>

                                            {/* Chỉ hiện chỉnh chiều cao nếu KHÔNG phải Full Size */}
                                            {!formData.isFullSize && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Chiều cao (px):</span>
                                                    <input type="number" min="100" max="2000" value={formData.mobileHeight} onChange={(e)=>setFormData({...formData, mobileHeight: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                                </div>
                                            )}
                                            {formData.isFullSize && <p className="text-[10px] text-gray-500 italic">* Chiều cao tự động theo tỷ lệ ảnh gốc (Full Size)</p>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- SIMULATOR (MÔ PHỎNG) --- */}
                            <div className="w-[120px] flex flex-col gap-2">
                                <span className="text-[10px] uppercase font-bold text-gray-400 text-center">Mô phỏng</span>
                                <div className={`flex-1 border-2 border-dashed rounded-lg flex items-center justify-center relative bg-gray-100 ${previewMode === "desktop" ? "border-blue-300" : "border-green-300"}`}>
                                    {/* Màn hình giả lập */}
                                    <div 
                                        className="bg-white border shadow-sm transition-all duration-300 flex items-center justify-center text-[9px] text-gray-400 overflow-hidden"
                                        style={{
                                            // Mô phỏng tỷ lệ tương đối
                                            width: `${previewMode === "desktop" ? Math.min(formData.desktopWidth, 100) : Math.min(formData.mobileWidth, 100)}%`,
                                            height: formData.isFullSize ? "auto" : `${previewMode === "desktop" ? 60 : 80}px`, // Nếu full size thì height auto, ko thì fix cứng để demo
                                            aspectRatio: formData.isFullSize ? "16/9" : "auto", // Giả lập tỷ lệ ảnh nếu full size
                                            borderWidth: "1px",
                                            borderColor: previewMode === "desktop" ? "#3b82f6" : "#22c55e"
                                        }}
                                    >
                                        {formData.isFullSize ? "Auto H" : "Fixed H"}
                                    </div>
                                    
                                    <span className="absolute bottom-1 right-1 text-[8px] text-gray-400 font-mono">
                                        {previewMode === "desktop" ? "PC" : "MB"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>

        {!formData.isSpecial && <MediaInputSection />}
        {formData.isSpecial && (
            <div className="pt-2 border-t border-gray-100">
                <MediaInputSection />
            </div>
        )}

        <button type="submit" disabled={loading} className={`w-full py-3 px-4 rounded-lg shadow-md text-sm font-bold text-white flex justify-center items-center gap-2 disabled:opacity-50 transition-all ${editingCollection ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-600 hover:bg-blue-700"}`}>
          {loading ? <Loader className="animate-spin" /> : editingCollection ? <Save /> : <PlusCircle />} 
          {loading ? "Đang xử lý..." : editingCollection ? "Lưu thay đổi" : "Tạo mới"}
        </button>
    </form>
  );

  if (editingCollection) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-yellow-600 flex items-center gap-2"><Save size={20}/> Chỉnh sửa Bộ sưu tầm</h2>
                <button onClick={handleReset} className="p-1 hover:bg-gray-100 rounded-full"><X size={24} className="text-gray-500"/></button>
            </div>
            <div className="p-6"><FormContent /></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-6 mb-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-2"><PlusCircle size={20}/> Tạo bộ sưu tầm mới</h2>
      <FormContent />
    </div>
  );
};

export default CreateCollectionForm;