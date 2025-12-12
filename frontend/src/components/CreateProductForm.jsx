import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Loader, Star, Layout, Monitor, Smartphone, EyeOff, Save, X, Maximize } from "lucide-react";
import { useCollectionStore } from "../stores/useCollectionStore";

const CreateCollectionForm = () => {
  const { createCollection, updateCollection, editingCollection, setEditingCollection } = useCollectionStore();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    media: "",
    gradientFrom: "#3b82f6", 
    gradientTo: "#06b6d4",
    isSpecial: false,
    specialPosition: "below_banner",
    
    // Config hiển thị
    isFullSize: false,   // ✅ Mới: Chế độ Full Size
    generalScale: 100,   // ✅ Mới: Scale chung cho Full Size
    
    desktopWidth: 100,
    desktopHeight: 600,
    mobileWidth: 100,
    mobileHeight: 400,

    hideName: false,
    hideDescription: false,
  });
  
  const [previewMode, setPreviewMode] = useState("desktop"); 
  const [loading, setLoading] = useState(false);

  // ✅ EFFECT: Tự động điền form khi bấm nút Edit
  useEffect(() => {
    if (editingCollection) {
      setFormData({
        name: editingCollection.name || "",
        description: editingCollection.description || "",
        media: editingCollection.coverMedia?.url || "",
        gradientFrom: editingCollection.gradientFrom || "#3b82f6",
        gradientTo: editingCollection.gradientTo || "#06b6d4",
        isSpecial: editingCollection.isSpecial || false,
        specialPosition: editingCollection.specialPosition || "below_banner",
        
        isFullSize: editingCollection.isFullSize || false,
        generalScale: editingCollection.generalScale || 100,

        desktopWidth: editingCollection.desktopWidth || 100,
        desktopHeight: editingCollection.desktopHeight || 600,
        mobileWidth: editingCollection.mobileWidth || 100,
        mobileHeight: editingCollection.mobileHeight || 400,

        hideName: editingCollection.hideName || false,
        hideDescription: editingCollection.hideDescription || false,
      });
      // Cuộn lên đầu trang khi edit
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingCollection]);

  const handleReset = () => {
    setFormData({
      name: "", description: "", media: "",
      gradientFrom: "#3b82f6", gradientTo: "#06b6d4",
      isSpecial: false, specialPosition: "below_banner",
      isFullSize: false, generalScale: 100,
      desktopWidth: 100, desktopHeight: 600,
      mobileWidth: 100, mobileHeight: 400,
      hideName: false, hideDescription: false,
    });
    setEditingCollection(null); // Thoát chế độ edit
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, media: reader.result });
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
        // Nếu media bắt đầu bằng http (link cũ) thì giữ nguyên, nếu data:video (upload mới) thì set type
        type: formData.media.startsWith("data:video") ? "video" : "image", 
      },
      gradientFrom: formData.gradientFrom,
      gradientTo: formData.gradientTo,
      isSpecial: formData.isSpecial,
      specialPosition: formData.specialPosition,
      
      isFullSize: formData.isFullSize,
      generalScale: Number(formData.generalScale),

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
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const MediaInputSection = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700">Ảnh/Video minh họa</label>
      <input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
      {formData.media && (
        <div className="mt-3 relative group">
          {formData.media.startsWith("data:video") || formData.media.match(/\.(mp4|webm)$/i) ? (
            <video src={formData.media} controls className="w-full rounded-lg border max-h-[200px] object-cover" />
          ) : (
            <img src={formData.media} alt="preview" className="w-full h-32 object-cover rounded-lg border" />
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      className={`bg-white border shadow-xl rounded-xl p-8 mb-8 max-w-2xl mx-auto transition-all ${editingCollection ? "border-yellow-400 ring-2 ring-yellow-100" : "border-gray-200"}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${editingCollection ? "text-yellow-600" : "text-blue-700"}`}>
            {editingCollection ? "Chỉnh sửa Bộ sưu tầm" : "Tạo bộ sưu tầm mới"}
          </h2>
          {editingCollection && (
            <button onClick={handleReset} className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-sm">
                <X size={16}/> Hủy
            </button>
          )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tên & Màu Gradient */}
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

        {/* --- KHU VỰC SPECIAL COLLECTION --- */}
        <div className="p-5 border border-blue-200 bg-blue-50 rounded-lg space-y-4">
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setFormData({...formData, isSpecial: !formData.isSpecial})}>
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${formData.isSpecial ? "bg-yellow-400 border-yellow-400 scale-110" : "bg-white border-gray-300"}`}>
                    {formData.isSpecial && <Star size={14} className="text-white fill-current" />}
                </div>
                <span className="font-bold text-gray-800">Đây là Special Collection?</span>
            </div>

            {formData.isSpecial && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-2 space-y-6">
                    
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
                        <div className="flex items-end gap-3 pb-1">
                             <button type="button" onClick={() => setFormData({...formData, hideName: !formData.hideName})} 
                                className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1 ${formData.hideName ? "bg-red-100 border-red-300 text-red-600" : "bg-white border-gray-300 text-gray-500"}`}>
                                <EyeOff size={12}/> Giấu Tên
                             </button>
                             <button type="button" onClick={() => setFormData({...formData, hideDescription: !formData.hideDescription})} 
                                className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1 ${formData.hideDescription ? "bg-red-100 border-red-300 text-red-600" : "bg-white border-gray-300 text-gray-500"}`}>
                                <EyeOff size={12}/> Giấu Mô Tả
                             </button>
                        </div>
                    </div>

                    <hr className="border-blue-200" />

                    {/* --- CẤU HÌNH SIZE (Full vs Custom) --- */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                                <Layout size={16}/> Cấu hình hiển thị
                            </h3>
                            
                            {/* Toggle Full Size */}
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({...formData, isFullSize: !formData.isFullSize})}>
                                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${formData.isFullSize ? "bg-blue-600" : "bg-gray-300"}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${formData.isFullSize ? "translate-x-5" : "translate-x-0"}`}></div>
                                </div>
                                <span className={`text-xs font-bold ${formData.isFullSize ? "text-blue-600" : "text-gray-500"}`}>Chế độ Full Size</span>
                            </div>
                        </div>

                        {/* ✅ LOGIC HIỂN THỊ DỰA VÀO FULL SIZE */}
                        {formData.isFullSize ? (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-4 rounded border border-blue-200 shadow-sm text-center">
                                <Maximize className="mx-auto text-blue-500 mb-2" size={32} />
                                <p className="text-sm text-gray-600 mb-4">Collection sẽ tự động tràn chiều ngang màn hình.</p>
                                
                                <div className="max-w-xs mx-auto">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Thu phóng nội dung</span> 
                                        <b>{formData.generalScale}%</b>
                                    </div>
                                    <input type="range" min="50" max="150" step="5" value={formData.generalScale} onChange={(e)=>setFormData({...formData, generalScale: e.target.value})} className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>
                             </motion.div>
                        ) : (
                            // --- Giữ nguyên logic Custom Size cũ ---
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                     {/* Switch Preview Mode */}
                                     <div className="flex bg-white rounded-md shadow-sm p-1 border border-blue-100 w-fit mb-2">
                                        <button type="button" onClick={() => setPreviewMode("desktop")} className={`p-1.5 rounded ${previewMode === "desktop" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}><Monitor size={18}/></button>
                                        <button type="button" onClick={() => setPreviewMode("mobile")} className={`p-1.5 rounded ${previewMode === "mobile" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}><Smartphone size={18}/></button>
                                    </div>

                                    {/* Inputs */}
                                    <div className={`p-3 rounded border transition-colors ${previewMode === "desktop" ? "bg-white border-blue-400 shadow-sm" : "bg-gray-50 border-gray-200 hidden"}`}>
                                        <div className="space-y-2">
                                            <div><div className="flex justify-between text-xs text-gray-500"><span>Chiều ngang Desktop (%)</span> <b>{formData.desktopWidth}%</b></div>
                                            <input type="range" min="20" max="300" step="5" value={formData.desktopWidth} onChange={(e)=>setFormData({...formData, desktopWidth: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" /></div>
                                            <div><div className="flex justify-between text-xs text-gray-500"><span>Chiều dọc Desktop (px)</span> <b>{formData.desktopHeight}px</b></div>
                                            <input type="number" min="100" max="2000" value={formData.desktopHeight} onChange={(e)=>setFormData({...formData, desktopHeight: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" /></div>
                                        </div>
                                    </div>

                                    <div className={`p-3 rounded border transition-colors ${previewMode === "mobile" ? "bg-white border-green-400 shadow-sm" : "bg-gray-50 border-gray-200 hidden"}`}>
                                        <div className="space-y-2">
                                            <div><div className="flex justify-between text-xs text-gray-500"><span>Chiều ngang Mobile (%)</span> <b>{formData.mobileWidth}%</b></div>
                                            <input type="range" min="20" max="300" step="5" value={formData.mobileWidth} onChange={(e)=>setFormData({...formData, mobileWidth: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600" /></div>
                                            <div><div className="flex justify-between text-xs text-gray-500"><span>Chiều dọc Mobile (px)</span> <b>{formData.mobileHeight}px</b></div>
                                            <input type="number" min="100" max="2000" value={formData.mobileHeight} onChange={(e)=>setFormData({...formData, mobileHeight: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* PREVIEW SIMULATOR - Rút gọn */}
                                <div className="flex-1 flex flex-col items-center justify-center bg-gray-200 rounded-lg border border-gray-300 p-2 min-h-[150px] relative overflow-hidden">
                                    <span className="absolute top-1 left-2 text-[8px] text-gray-500 font-mono uppercase">Preview</span>
                                    <div className="w-[100px] h-[100px] bg-white border border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-400">
                                        {previewMode === "desktop" ? `${formData.desktopWidth}%` : `${formData.mobileWidth}%`}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>

        {!formData.isSpecial && <MediaInputSection />}
        {formData.isSpecial && (
            <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-800 mb-2">Hình minh họa (Hiển thị cuối)</p>
                <MediaInputSection />
            </div>
        )}

        {/* Nút Submit đổi màu và text khi edit */}
        <button type="submit" disabled={loading} className={`w-full py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white flex justify-center disabled:opacity-50 transition-colors ${editingCollection ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-600 hover:bg-blue-700"}`}>
          {loading ? <Loader className="mr-2 h-5 w-5 animate-spin" /> : editingCollection ? <Save className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />} 
          {loading ? "Đang xử lý..." : editingCollection ? "Lưu thay đổi" : "Tạo bộ sưu tầm"}
        </button>

        {editingCollection && (
            <div className="text-center">
                <button type="button" onClick={handleReset} className="text-xs text-gray-500 hover:underline">Hủy chỉnh sửa</button>
            </div>
        )}
      </form>
    </motion.div>
  );
};

export default CreateCollectionForm;