import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Loader, Star, Layout, Monitor, Smartphone, EyeOff } from "lucide-react";
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
    
    // ✅ Default Value
    desktopWidth: 100,
    desktopHeight: 600,
    mobileWidth: 100,
    mobileHeight: 400,

    hideName: false,
    hideDescription: false,
  });
  
  const [previewMode, setPreviewMode] = useState("desktop"); 
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
      
      desktopWidth: Number(newCollection.desktopWidth),
      desktopHeight: Number(newCollection.desktopHeight),
      mobileWidth: Number(newCollection.mobileWidth),
      mobileHeight: Number(newCollection.mobileHeight),

      hideName: newCollection.hideName,
      hideDescription: newCollection.hideDescription,
    });
    setNewCollection({
      name: "", description: "", media: "",
      gradientFrom: "#3b82f6", gradientTo: "#06b6d4",
      isSpecial: false, specialPosition: "below_banner",
      desktopWidth: 100, desktopHeight: 600,
      mobileWidth: 100, mobileHeight: 400,
      hideName: false, hideDescription: false,
    });
    setLoading(false);
  };

  const MediaInputSection = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700">Ảnh/Video minh họa</label>
      <input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="mt-2" />
      {newCollection.media && (
        <div className="mt-3">
          {newCollection.media.startsWith("data:video") ? (
            <video src={newCollection.media} controls className="w-full rounded-lg border max-h-[200px] object-cover" />
          ) : (
            <img src={newCollection.media} alt="preview" className="w-full h-32 object-cover rounded-lg border" />
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-xl rounded-xl p-8 mb-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Tạo bộ sưu tầm mới</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Tên bộ sưu tầm</label>
                <input type="text" value={newCollection.name} onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu Gradient</label>
                <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={newCollection.gradientFrom} onChange={(e) => setNewCollection({...newCollection, gradientFrom: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <span className="text-gray-400">to</span>
                    <input type="color" value={newCollection.gradientTo} onChange={(e) => setNewCollection({...newCollection, gradientTo: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0" />
                </div>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea rows="2" value={newCollection.description} onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div className="p-5 border border-blue-200 bg-blue-50 rounded-lg space-y-4">
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setNewCollection({...newCollection, isSpecial: !newCollection.isSpecial})}>
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${newCollection.isSpecial ? "bg-yellow-400 border-yellow-400 scale-110" : "bg-white border-gray-300"}`}>
                    {newCollection.isSpecial && <Star size={14} className="text-white fill-current" />}
                </div>
                <span className="font-bold text-gray-800">Đây là Special Collection?</span>
            </div>

            {newCollection.isSpecial && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-2 space-y-6">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Vị trí hiển thị:</label>
                            <select value={newCollection.specialPosition} onChange={(e) => setNewCollection({ ...newCollection, specialPosition: e.target.value })} className="w-full border border-gray-300 rounded py-1.5 px-2 text-sm">
                                <option value="below_banner">Dưới Banner</option>
                                <option value="below_categories">Dưới Danh mục</option>
                                <option value="below_featured">Dưới Sản phẩm nổi bật</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-3 pb-1">
                             <button type="button" onClick={() => setNewCollection({...newCollection, hideName: !newCollection.hideName})} 
                                className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1 ${newCollection.hideName ? "bg-red-100 border-red-300 text-red-600" : "bg-white border-gray-300 text-gray-500"}`}>
                                <EyeOff size={12}/> Giấu Tên
                             </button>
                             <button type="button" onClick={() => setNewCollection({...newCollection, hideDescription: !newCollection.hideDescription})} 
                                className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1 ${newCollection.hideDescription ? "bg-red-100 border-red-300 text-red-600" : "bg-white border-gray-300 text-gray-500"}`}>
                                <EyeOff size={12}/> Giấu Mô Tả
                             </button>
                        </div>
                    </div>

                    <hr className="border-blue-200" />

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Tùy chỉnh Kích thước (Free Size)</h3>
                            <div className="flex bg-white rounded-md shadow-sm p-1 border border-blue-100">
                                <button type="button" onClick={() => setPreviewMode("desktop")} className={`p-1.5 rounded ${previewMode === "desktop" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}><Monitor size={18}/></button>
                                <button type="button" onClick={() => setPreviewMode("mobile")} className={`p-1.5 rounded ${previewMode === "mobile" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}><Smartphone size={18}/></button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                
                                <div className={`p-3 rounded border transition-colors ${previewMode === "desktop" ? "bg-white border-blue-400 shadow-sm" : "bg-gray-50 border-gray-200 opacity-60"}`}>
                                    <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700"><Monitor size={14} /> Desktop Config</div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500"><span>Chiều ngang (%)</span> <b>{newCollection.desktopWidth}%</b></div>
                                            {/* ✅ MAX 300% cho Desktop */}
                                            <input type="range" min="20" max="300" step="5" value={newCollection.desktopWidth} onChange={(e)=>setNewCollection({...newCollection, desktopWidth: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500"><span>Chiều dọc (px)</span> <b>{newCollection.desktopHeight}px</b></div>
                                            {/* ✅ MAX 2000px cho Desktop */}
                                            <input type="number" min="100" max="2000" value={newCollection.desktopHeight} onChange={(e)=>setNewCollection({...newCollection, desktopHeight: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-3 rounded border transition-colors ${previewMode === "mobile" ? "bg-white border-green-400 shadow-sm" : "bg-gray-50 border-gray-200 opacity-60"}`}>
                                    <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700"><Smartphone size={14} /> Mobile Config</div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500"><span>Chiều ngang (%)</span> <b>{newCollection.mobileWidth}%</b></div>
                                            {/* ✅ MAX 300% cho Mobile */}
                                            <input type="range" min="20" max="300" step="5" value={newCollection.mobileWidth} onChange={(e)=>setNewCollection({...newCollection, mobileWidth: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500"><span>Chiều dọc (px)</span> <b>{newCollection.mobileHeight}px</b></div>
                                            {/* ✅ MAX 2000px cho Mobile */}
                                            <input type="number" min="100" max="2000" value={newCollection.mobileHeight} onChange={(e)=>setNewCollection({...newCollection, mobileHeight: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PREVIEW SIMULATOR */}
                            <div className="flex-1 flex flex-col items-center justify-center bg-gray-200 rounded-lg border border-gray-300 p-4 min-h-[300px] relative overflow-hidden">
                                <span className="absolute top-2 left-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest">Live Preview</span>
                                
                                {previewMode === "desktop" ? (
                                    <div className="w-full aspect-video bg-white shadow-lg rounded-md border border-gray-300 flex flex-col relative overflow-hidden">
                                        <div className="h-4 bg-gray-100 border-b flex items-center gap-1 px-2">
                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        </div>
                                        {/* Overflow auto/hidden ở đây giúp hình dung việc bị tràn màn hình */}
                                        <div className="flex-1 flex items-center justify-center bg-gray-50 p-2 overflow-hidden relative">
                                            <div 
                                                className="bg-blue-100 border-2 border-dashed border-blue-400 flex items-center justify-center text-blue-500 text-[10px] font-bold transition-all duration-300 absolute"
                                                style={{
                                                    // Mô phỏng width theo % container preview
                                                    width: `${newCollection.desktopWidth}%`,
                                                    height: `${newCollection.desktopHeight / 4}px` 
                                                }}
                                            >
                                                Desktop Box<br/>
                                                {newCollection.desktopWidth}%
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-[140px] aspect-[9/18] bg-white shadow-xl rounded-[20px] border-4 border-gray-800 flex flex-col relative overflow-hidden">
                                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3 bg-gray-800 rounded-b-lg z-10"></div>
                                         <div className="flex-1 flex items-center justify-center bg-gray-50 px-1 overflow-hidden relative">
                                            <div 
                                                className="bg-green-100 border-2 border-dashed border-green-400 flex items-center justify-center text-green-600 text-[8px] font-bold transition-all duration-300 text-center absolute"
                                                style={{
                                                    width: `${newCollection.mobileWidth}%`,
                                                    height: `${newCollection.mobileHeight / 3}px`
                                                }}
                                            >
                                                Mobile<br/>
                                                {newCollection.mobileWidth}%
                                            </div>
                                         </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>

        {!newCollection.isSpecial && <MediaInputSection />}
        {newCollection.isSpecial && (
            <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-800 mb-2">Hình minh họa (Hiển thị cuối)</p>
                <MediaInputSection />
            </div>
        )}

        <button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 mt-6 flex justify-center">
          {loading ? <Loader className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />} {loading ? "Đang tạo..." : "Tạo bộ sưu tầm"}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateCollectionForm;