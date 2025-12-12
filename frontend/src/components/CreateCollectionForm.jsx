import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Loader, Star, Layout, EyeOff, Save, X, Maximize, UploadCloud, Monitor, Smartphone, Laptop } from "lucide-react";
import { useCollectionStore } from "../stores/useCollectionStore";

// ==========================================
// 1. COMPONENT MÔ PHỎNG THIẾT BỊ (SIMULATOR)
// ==========================================
const DeviceSimulator = ({ formData }) => {
  return (
    <div className="flex flex-col xl:flex-row gap-8 items-center justify-center p-6 bg-gray-100 rounded-xl border border-gray-300 mt-4">
      {/* --- LAPTOP SIMULATOR --- */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <Monitor size={14} /> Desktop View
        </div>
        
        {/* Khung Laptop */}
        <div className="relative bg-gray-800 rounded-t-xl rounded-b-md p-2 shadow-xl border-b-4 border-gray-900 w-[300px]">
          {/* Camera dot */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-600 rounded-full"></div>
          
          {/* Màn hình bên trong */}
          <div className="bg-white rounded overflow-hidden relative w-full h-[180px] flex items-center justify-center border border-gray-700">
             {/* Content giả lập */}
             <div 
                className="bg-blue-50 border border-blue-400 border-dashed text-blue-500 flex items-center justify-center text-[10px] shadow-sm transition-all duration-300"
                style={{
                    width: `${formData.desktopWidth}%`,
                    height: formData.isFullSize ? "100%" : "60%", // Demo height tương đối
                    aspectRatio: formData.isFullSize ? "16/9" : "auto", 
                }}
             >
                <div className="text-center">
                    <p className="font-bold">{formData.desktopWidth}%</p>
                    <p className="text-[8px] opacity-70">{formData.isFullSize ? "Auto Height" : `${formData.desktopHeight}px`}</p>
                </div>
             </div>
             
             {/* Ghi chú nền */}
             <div className="absolute inset-0 -z-10 flex items-center justify-center text-gray-200 text-4xl font-bold opacity-20 select-none">WEB</div>
          </div>
        </div>
        {/* Chân đế Laptop */}
        <div className="w-[320px] h-3 bg-gray-300 rounded-b-xl shadow-md border-t border-gray-400"></div>
      </div>

      {/* --- PHONE SIMULATOR --- */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <Smartphone size={14} /> Mobile View
        </div>

        {/* Khung Điện thoại */}
        <div className="relative bg-gray-900 rounded-[2rem] p-2 shadow-xl border border-gray-700 w-[140px]">
           {/* Notch / Dynamic Island */}
           <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-3 bg-black rounded-full z-10"></div>
           
           {/* Màn hình bên trong */}
           <div className="bg-white rounded-[1.5rem] overflow-hidden w-full h-[240px] flex items-center justify-center relative border border-gray-200">
              {/* Content giả lập */}
              <div 
                  className="bg-green-50 border border-green-400 border-dashed text-green-600 flex items-center justify-center text-[10px] shadow-sm transition-all duration-300"
                  style={{
                      width: `${formData.mobileWidth}%`,
                      height: formData.isFullSize ? "auto" : "50%",
                      aspectRatio: formData.isFullSize ? "9/16" : "auto",
                  }}
              >
                  <div className="text-center p-1">
                      <p className="font-bold">{formData.mobileWidth}%</p>
                      <p className="text-[8px] opacity-70">{formData.isFullSize ? "Auto H" : `${formData.mobileHeight}px`}</p>
                  </div>
              </div>

              {/* Ghi chú nền */}
              <div className="absolute inset-0 -z-10 flex items-center justify-center text-gray-200 text-2xl font-bold opacity-20 select-none rotate-90">APP</div>
           </div>

           {/* Nút Home ảo (nếu cần) */}
           <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPONENT NỘI DUNG FORM (TÁCH RA NGOÀI ĐỂ FIX BUG INPUT)
// ==========================================
const CollectionFormContent = ({ formData, setFormData, loading, editingCollection, handleReset, handleSubmit, handleMediaChange }) => {
    
    // Sub-component nhỏ hiển thị Media Input (có thể để ở đây vì nó không chứa state input text)
    const MediaInputSection = () => (
        <div>
          <label className="block text-sm font-medium text-gray-700">Ảnh/Video minh họa</label>
          <div className="mt-2 flex items-center gap-4">
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition border border-gray-300">
               <UploadCloud size={18}/> <span>Chọn file...</span>
               <input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden"/>
            </label>
            {formData.media && <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200">Đã chọn file</span>}
          </div>
          
          {formData.media && (
            <div className="mt-3 relative group rounded-lg overflow-hidden border border-gray-300 bg-gray-50 shadow-sm">
              {formData.mediaType === "video" ? (
                <video src={formData.media} controls className="w-full max-h-[200px] object-cover" />
              ) : (
                <img src={formData.media} alt="preview" className="w-full h-32 object-cover" />
              )}
            </div>
          )}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tên & Màu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tên bộ sưu tầm</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 shadow-sm" required placeholder="Ví dụ: Summer Collection 2025" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Màu Gradient</label>
                    <div className="flex items-center gap-2 mt-1 bg-gray-50 p-1.5 rounded-md border border-gray-200 w-fit">
                        <input type="color" value={formData.gradientFrom} onChange={(e) => setFormData({...formData, gradientFrom: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0" title="Màu bắt đầu" />
                        <span className="text-gray-400 text-xs font-bold">TO</span>
                        <input type="color" value={formData.gradientTo} onChange={(e) => setFormData({...formData, gradientTo: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0" title="Màu kết thúc" />
                    </div>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mô tả ngắn</label>
              <textarea rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 shadow-sm" required placeholder="Mô tả về bộ sưu tập này..." />
            </div>

            {/* --- SPECIAL SECTION --- */}
            <div className="p-5 border border-blue-200 bg-blue-50/50 rounded-xl space-y-4">
                <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => setFormData({...formData, isSpecial: !formData.isSpecial})}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.isSpecial ? "bg-yellow-400 border-yellow-400 shadow-sm" : "bg-white border-gray-300 group-hover:border-blue-400"}`}>
                        {formData.isSpecial && <Star size={12} className="text-white fill-current" />}
                    </div>
                    <span className="font-bold text-gray-800 text-sm">Cài đặt hiển thị đặc biệt (Banner/QC)</span>
                </div>

                {formData.isSpecial && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-2 space-y-6 pt-2">
                        {/* Vị trí & Ẩn hiện */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Vị trí hiển thị:</label>
                                <div className="relative">
                                    <select value={formData.specialPosition} onChange={(e) => setFormData({ ...formData, specialPosition: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
                                        <option value="below_banner">Dưới Banner chính</option>
                                        <option value="below_categories">Dưới Danh mục (Categories)</option>
                                        <option value="below_featured">Dưới Sản phẩm nổi bật</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-end gap-2 pb-0.5">
                                 <button type="button" onClick={() => setFormData({...formData, hideName: !formData.hideName})} 
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${formData.hideName ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}>
                                    <EyeOff size={14}/> {formData.hideName ? "Đang ẩn Tên" : "Ẩn Tên"}
                                 </button>
                                 <button type="button" onClick={() => setFormData({...formData, hideDescription: !formData.hideDescription})} 
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${formData.hideDescription ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}>
                                    <EyeOff size={14}/> {formData.hideDescription ? "Đang ẩn Mô tả" : "Ẩn Mô tả"}
                                 </button>
                            </div>
                        </div>

                        <hr className="border-blue-200/50" />

                        {/* --- CẤU HÌNH SIZE --- */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2"><Layout size={14}/> Cấu hình hiển thị</h3>
                                
                                {/* Toggle Full Size */}
                                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setFormData({...formData, isFullSize: !formData.isFullSize})}>
                                    <span className={`text-xs font-bold transition-colors ${formData.isFullSize ? "text-blue-600" : "text-gray-500"}`}>Custom Size</span>
                                    <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${formData.isFullSize ? "bg-blue-600" : "bg-gray-300"}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.isFullSize ? "translate-x-5" : "translate-x-0"}`}></div>
                                    </div>
                                    <span className={`text-xs font-bold transition-colors ${formData.isFullSize ? "text-blue-600" : "text-gray-500"}`}>Full Size</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Desktop Config */}
                                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3 text-blue-700">
                                        <Laptop size={16} /> <span className="text-sm font-bold">Cấu hình Desktop</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                                                <span>Độ rộng (%)</span> <span className="text-blue-600 font-bold">{formData.desktopWidth}%</span>
                                            </div>
                                            <input type="range" min="20" max="150" step="5" value={formData.desktopWidth} onChange={(e)=>setFormData({...formData, desktopWidth: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg cursor-pointer accent-blue-600" />
                                        </div>
                                        {!formData.isFullSize && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-medium text-gray-500">Chiều cao (px):</span>
                                                <input type="number" min="100" max="2000" value={formData.desktopHeight} onChange={(e)=>setFormData({...formData, desktopHeight: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile Config */}
                                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3 text-green-700">
                                        <Smartphone size={16} /> <span className="text-sm font-bold">Cấu hình Mobile</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                                                <span>Độ rộng (%)</span> <span className="text-green-600 font-bold">{formData.mobileWidth}%</span>
                                            </div>
                                            <input type="range" min="20" max="150" step="5" value={formData.mobileWidth} onChange={(e)=>setFormData({...formData, mobileWidth: e.target.value})} className="w-full h-1.5 bg-gray-200 rounded-lg cursor-pointer accent-green-600" />
                                        </div>
                                        {!formData.isFullSize && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-medium text-gray-500">Chiều cao (px):</span>
                                                <input type="number" min="100" max="2000" value={formData.mobileHeight} onChange={(e)=>setFormData({...formData, mobileHeight: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-green-500 outline-none" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* --- ADD DEVICE SIMULATOR HERE --- */}
                            <DeviceSimulator formData={formData} />

                        </div>
                    </motion.div>
                )}
            </div>

            {!formData.isSpecial && <MediaInputSection />}
            {formData.isSpecial && (
                <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm font-bold text-gray-800 mb-2">Hình minh họa (Hiển thị cuối)</p>
                    <MediaInputSection />
                </div>
            )}

            <div className="pt-2">
                <button type="submit" disabled={loading} className={`w-full py-3 px-4 rounded-xl shadow-lg shadow-blue-200 text-sm font-bold text-white flex justify-center items-center gap-2 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 ${editingCollection ? "bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200" : "bg-blue-600 hover:bg-blue-700"}`}>
                {loading ? <Loader className="animate-spin" /> : editingCollection ? <Save /> : <PlusCircle />} 
                {loading ? "Đang xử lý..." : editingCollection ? "Lưu thay đổi" : "Tạo bộ sưu tầm"}
                </button>
            </div>
        </form>
    );
}

// ==========================================
// 3. MAIN COMPONENT (LOGIC CHÍNH)
// ==========================================
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
    
    isFullSize: false,   
    desktopWidth: 100,
    desktopHeight: 600,
    mobileWidth: 100,
    mobileHeight: 400,

    hideName: false,
    hideDescription: false,
  });
  
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
      // window.scrollTo({ top: 0, behavior: 'smooth' }); // Có thể bỏ nếu dùng modal
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

  // NẾU ĐANG EDIT => HIỆN MODAL
  if (editingCollection) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 p-4 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-yellow-600 flex items-center gap-2"><Save size={20}/> Chỉnh sửa Bộ sưu tầm</h2>
                <button onClick={handleReset} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-500"/></button>
            </div>
            <div className="p-6">
                <CollectionFormContent 
                    formData={formData} 
                    setFormData={setFormData} 
                    loading={loading} 
                    editingCollection={editingCollection}
                    handleReset={handleReset}
                    handleSubmit={handleSubmit}
                    handleMediaChange={handleMediaChange}
                />
            </div>
        </div>
      </div>
    );
  }

  // GIAO DIỆN TẠO MỚI (BÌNH THƯỜNG)
  return (
    <div className="bg-white border border-gray-200 shadow-xl rounded-2xl p-6 mb-8 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-2"><PlusCircle size={24}/> Tạo bộ sưu tầm mới</h2>
      <CollectionFormContent 
        formData={formData} 
        setFormData={setFormData} 
        loading={loading} 
        editingCollection={null}
        handleReset={handleReset}
        handleSubmit={handleSubmit}
        handleMediaChange={handleMediaChange}
      />
    </div>
  );
};

export default CreateCollectionForm;