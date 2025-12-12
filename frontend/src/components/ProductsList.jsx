import { useState, useEffect } from "react";
import { motion, Reorder, AnimatePresence, useDragControls } from "framer-motion";
import { Trash, Star, Settings, GripVertical, Save, RotateCcw, Plus, Upload, Tag } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCollectionStore } from "../stores/useCollectionStore";

// ⚡️ Cấu hình thứ tự ưu tiên
const CATEGORY_PRIORITY = {
  dress: 1,
  shirt: 2,
  set: 3,
  feedback: 4,
};

const categories = [
  { id: "dress", label: "Đầm nữ" },
  { id: "shirt", label: "Áo nữ" },
  { id: "set", label: "Đồ bộ" },
  { id: "feedback", label: "Feedback" },
];

const instantTransition = { duration: 0, ease: "linear" };

// -------------------- COMPONENT ROW (DESKTOP) --------------------
const ProductRow = ({ product, categories, collections, toggleFeaturedProduct, handleTogglePreorder, setEditingProduct, handleDelete, deletingId, isDraggable }) => {
  const controls = useDragControls();
  const col = collections.find((col) => (col.products || []).some((p) => p._id === product._id));
  const categoryLabel = categories.find((c) => c.id === product.category)?.label || product.category;

  const statusColor =
    product.isPreOrder === "preorder" ? "bg-purple-500 text-white"
    : product.isPreOrder === "out" ? "bg-red-500 text-white"
    : product.isPreOrder === "low" ? "bg-yellow-400 text-gray-900"
    : "bg-gray-200 text-gray-700";

  const statusLabel =
    product.isPreOrder === "preorder" ? "Pre-Order"
    : product.isPreOrder === "out" ? "Hết hàng"
    : product.isPreOrder === "low" ? "Số lượng còn ít"
    : "None";

  return (
    <Reorder.Item
      as="tr"
      value={product}
      dragListener={isDraggable}
      dragControls={controls}
      layout
      transition={instantTransition}
      className={`hover:bg-blue-5 border-b last:border-b-0 relative bg-white group ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      whileDrag={{ scale: 1.0, boxShadow: "0px 5px 15px rgba(0,0,0,0.15)", backgroundColor: "#f0f9ff", zIndex: 100 }}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img className="h-10 w-10 rounded-full object-cover border" src={product.image} alt={product.name} />
          <div className="ml-4 text-sm font-medium text-gray-900">
            {product.name}
            {product.isSale && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200">-{product.salePercentage}%</span>}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{product.price.toLocaleString()} ₫</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold 
          ${product.category === 'dress' ? 'bg-pink-100 text-pink-800' : 
            product.category === 'shirt' ? 'bg-blue-100 text-blue-800' :
            product.category === 'set' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {categoryLabel}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <button onClick={() => toggleFeaturedProduct(product._id)} className={`p-1 rounded-full ${product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-200 text-gray-500"} hover:scale-105 transition-transform`}>
          <Star className="h-5 w-5" />
        </button>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <button onClick={() => handleTogglePreorder(product)} className={`px-3 py-1 rounded text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </button>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{col ? col.name : "—"}</td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-3 text-sm font-medium">
          <button onClick={() => setEditingProduct(product)} className="text-gray-700 hover:text-blue-600"><Settings className="h-5 w-5" /></button>
          {deletingId === product._id ? <span className="text-gray-400 italic">Xóa...</span> : 
            <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-400"><Trash className="h-5 w-5" /></button>}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        {isDraggable && (
          <div onPointerDown={(e) => controls.start(e)} className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 flex justify-center items-center transition-colors">
            <GripVertical className="h-5 w-5" />
          </div>
        )}
      </td>
    </Reorder.Item>
  );
};

// -------------------- COMPONENT CARD (MOBILE) --------------------
const ProductCard = ({ product, categories, collections, toggleFeaturedProduct, handleTogglePreorder, setEditingProduct, handleDelete, deletingId, isDraggable }) => {
  const controls = useDragControls();
  const col = collections.find((col) => (col.products || []).some((p) => p._id === product._id));
  const cat = categories.find((c) => c.id === product.category)?.label || product.category;

  const statusColor =
    product.isPreOrder === "preorder" ? "bg-purple-500 text-white"
    : product.isPreOrder === "out" ? "bg-red-500 text-white"
    : product.isPreOrder === "low" ? "bg-yellow-400 text-gray-900"
    : "bg-gray-200 text-gray-700";

  const statusLabel =
    product.isPreOrder === "preorder" ? "Pre-Order"
    : product.isPreOrder === "out" ? "Hết hàng"
    : product.isPreOrder === "low" ? "Số lượng còn ít"
    : "None";

  return (
    <Reorder.Item
      value={product}
      dragListener={isDraggable}
      dragControls={controls}
      layout
      transition={instantTransition}
      whileDrag={{ scale: 1.02, zIndex: 100, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
      className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm bg-white touch-none"
    >
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded" />
        {product.isSale && <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 rounded font-bold">-{product.salePercentage}%</span>}
      </div>
      
      <div className="flex-1">
        <h3 className="font-semibold text-base text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-500">{cat}</p>
        <p className="text-blue-700 font-semibold">{product.price.toLocaleString()} ₫</p>
        <p className="text-xs text-gray-400">{col ? col.name : "—"}</p>
        <button onClick={() => handleTogglePreorder(product)} className={`mt-1 px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </button>
      </div>

      <div className="flex justify-between items-center gap-3 mt-2 sm:mt-0 border-t pt-2 sm:border-t-0 sm:pt-0 sm:flex-col sm:border-l sm:pl-3">
        <div className="flex gap-2">
          <button onClick={() => toggleFeaturedProduct(product._id)} className={`p-2 rounded-full ${product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-200 text-gray-500"}`}><Star className="h-5 w-5" /></button>
          <button onClick={() => setEditingProduct(product)} className="p-2 bg-blue-100 text-blue-600 rounded-full"><Settings className="h-5 w-5" /></button>
          <button onClick={() => handleDelete(product._id)} className="p-2 bg-red-100 text-red-500 rounded-full">{deletingId === product._id ? "…" : <Trash className="h-5 w-5" />}</button>
        </div>
        {isDraggable && (
          <div className="ml-auto sm:ml-0">
            <div onPointerDown={(e) => controls.start(e)} className="p-3 hover:bg-gray-100 rounded text-gray-500 flex justify-center items-center">
              <GripVertical className="h-6 w-6" />
            </div>
          </div>
        )}
      </div>
    </Reorder.Item>
  );
};

// -------------------- EDIT MODAL --------------------
const EditProductModal = ({ product, collections, onClose }) => {
  const { updateProduct, fetchAllProducts } = useProductStore();
  const { addProductToCollection, removeProductFromCollection } = useCollectionStore();

  const [formData, setFormData] = useState({
    name: "", 
    price: "", 
    category: "", 
    image: "", 
    thumbnails: [], 
    description: "", 
    productLink: "", 
    collectionId: "", 
    isPreOrder: "none",
    // ✅ Thêm trường Sale vào state
    isSale: false,
    salePercentage: ""
  });
  
  const [uploadingThumbIndex, setUploadingThumbIndex] = useState(null);
  const [uploadingMain, setUploadingMain] = useState(false);

  useEffect(() => {
    if (product) {
      const currentCol = collections.find((col) => (col.products || []).some((p) => p._id === product._id));
      setFormData({
        name: product.name || "", 
        price: product.price || 0, 
        category: product.category || "", 
        image: product.image || "", 
        thumbnails: Array.isArray(product.thumbnails) ? product.thumbnails : [], 
        description: product.description || "", 
        productLink: product.productLink || "", 
        collectionId: currentCol?._id || "", 
        isPreOrder: product.isPreOrder || "none",
        // ✅ Map dữ liệu Sale từ props
        isSale: product.isSale || false,
        salePercentage: product.salePercentage || ""
      });
    }
  }, [product, collections]);

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMain(true);
    const reader = new FileReader();
    
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result });
      setUploadingMain(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleThumbnailChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingThumbIndex(index);
    try {
      const formDataCloud = new FormData();
      formDataCloud.append("file", file);
      formDataCloud.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formDataCloud });
      const data = await res.json();
      
      const currentThumbs = Array.isArray(formData.thumbnails) ? formData.thumbnails : [];
      const newThumbs = [...currentThumbs]; 
      newThumbs[index] = data.secure_url;
      setFormData({ ...formData, thumbnails: newThumbs });
    } catch { alert("Lỗi upload thumb"); } finally { setUploadingThumbIndex(null); }
  };

  const addThumbnail = () => {
    const currentThumbs = Array.isArray(formData.thumbnails) ? formData.thumbnails : [];
    setFormData({ ...formData, thumbnails: [...currentThumbs, ""] });
  };

  const removeThumbnail = (index) => {
    const currentThumbs = Array.isArray(formData.thumbnails) ? formData.thumbnails : [];
    const newThumbs = currentThumbs.filter((_, i) => i !== index);
    setFormData({ ...formData, thumbnails: newThumbs });
  };

  const handleSave = async () => {
    try {
      await updateProduct(product._id, formData);
      
      const oldCol = collections.find((col) => (col.products || []).some((p) => p._id === product._id));
      if (oldCol && oldCol._id !== formData.collectionId) await removeProductFromCollection(oldCol._id, product._id);
      if (formData.collectionId && (!oldCol || oldCol._id !== formData.collectionId)) await addProductToCollection(formData.collectionId, product);
      
      await fetchAllProducts();
      onClose();
    } catch { alert("Lỗi update sản phẩm"); }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-10 sm:pt-20 z-[1001]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-lg shadow-xl space-y-4 overflow-y-auto max-h-[95vh]">
        <h2 className="text-xl font-semibold mb-2 text-blue-800">⚙️ Chỉnh sửa: {product.name}</h2>
        
        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border p-2 rounded" placeholder="Tên" />
        <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full border p-2 rounded" placeholder="Giá" />
        
        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border p-2 rounded">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        
        <select value={formData.collectionId} onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })} className="w-full border p-2 rounded">
          <option value="">Chọn bộ sưu tập</option>
          {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        
        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border p-2 rounded h-24" placeholder="Mô tả" />
        
        {/* ✅ KHU VỰC CHỈNH SALE */}
        <div className="bg-gray-50 p-3 rounded border">
            <div className="flex items-center gap-2 mb-2">
                <input 
                    type="checkbox" 
                    id="editIsSale" 
                    checked={formData.isSale} 
                    onChange={(e) => setFormData({...formData, isSale: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="editIsSale" className="font-medium flex items-center gap-1 cursor-pointer select-none">
                    <Tag className="w-4 h-4 text-red-500"/> Đang giảm giá (Sale)
                </label>
            </div>
            {formData.isSale && (
                <div className="flex items-center gap-2 pl-6 animate-in fade-in slide-in-from-top-1">
                    <span className="text-sm">Giảm:</span>
                    <input 
                        type="number" 
                        value={formData.salePercentage} 
                        onChange={(e) => setFormData({...formData, salePercentage: e.target.value})}
                        className="w-20 border p-1 rounded text-sm focus:ring-red-500"
                        placeholder="%"
                    />
                    <span className="text-sm font-bold">%</span>
                </div>
            )}
        </div>

        {formData.category === "feedback" && <input type="text" value={formData.productLink} onChange={(e) => setFormData({ ...formData, productLink: e.target.value })} className="w-full border p-2 rounded" placeholder="Link sản phẩm" />}
        
        <div className="flex flex-col gap-1 mt-2">
          <label className="text-sm font-medium">Trạng thái</label>
          <div onClick={() => { const o = ["none", "preorder", "out", "low"]; setFormData({ ...formData, isPreOrder: o[(o.indexOf(formData.isPreOrder) + 1) % 4] }); }} className="cursor-pointer px-3 py-2 rounded bg-gray-200 text-center text-sm font-medium transition-all hover:bg-gray-300 select-none">
            {formData.isPreOrder === "none" ? "Có sẵn" : formData.isPreOrder}
          </div>
        </div>

        <div className="space-y-2 mt-2">
            <label className="block font-medium text-sm">Ảnh chính</label>
            <div className="relative group w-full h-40">
                {formData.image ? (
                    <img src={formData.image} className="w-full h-full object-cover rounded border" alt="main" />
                ) : (
                    <div className="w-full h-full bg-gray-100 rounded border flex items-center justify-center text-gray-400">Chưa có ảnh</div>
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded">
                    <Upload className="w-6 h-6 mr-2" /> Thay ảnh
                    <input type="file" className="hidden" onChange={handleMainImageChange} disabled={uploadingMain} accept="image/*" />
                </label>
                {uploadingMain && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-sm font-medium">Đang xử lý ảnh...</div>}
            </div>
        </div>

        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
                <label className="font-medium text-sm">Ảnh phụ ({(formData.thumbnails || []).length})</label>
                <button onClick={addThumbnail} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                    <Plus className="w-3 h-3" /> Thêm ảnh
                </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {(Array.isArray(formData.thumbnails) ? formData.thumbnails : []).map((thumb, index) => (
                    <div key={index} className="relative group aspect-square bg-gray-50 border rounded overflow-hidden">
                        {thumb ? (
                            <img src={thumb} alt={`thumb-${index}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Trống</div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <label className="cursor-pointer text-white hover:text-blue-200">
                                <Upload className="w-5 h-5" />
                                <input type="file" className="hidden" onChange={(e) => handleThumbnailChange(e, index)} disabled={uploadingThumbIndex === index} accept="image/*" />
                            </label>
                            <button onClick={() => removeThumbnail(index)} className="text-white hover:text-red-400">
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                        {uploadingThumbIndex === index && (
                            <div className="absolute inset-0 bg-white/90 flex items-center justify-center text-xs font-medium">...</div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors">Hủy</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">Lưu thay đổi</button>
        </div>
      </motion.div>
    </div>
  );
};

// -------------------- MAIN LIST COMPONENT --------------------
const ProductsList = () => {
  const { products, deleteProduct, toggleFeaturedProduct, updateProduct, reorderProducts } = useProductStore();
  const { collections, fetchCollections, removeProductFromCollection } = useCollectionStore();

  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  
  const [localProducts, setLocalProducts] = useState([]);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);
  
  useEffect(() => {
    const safeProducts = Array.isArray(products) ? [...products] : [];
    
    let processed = safeProducts;

    if (filterCategory === "all") {
      processed.sort((a, b) => {
        const prioA = CATEGORY_PRIORITY[a.category] || 99;
        const prioB = CATEGORY_PRIORITY[b.category] || 99;
        if (prioA !== prioB) return prioA - prioB;
        return a.order - b.order;
      });
    } else {
      processed = processed
        .filter(p => p.category === filterCategory)
        .sort((a, b) => a.order - b.order);
    }

    setLocalProducts(processed);
    setIsOrderChanged(false);
  }, [products, filterCategory]);

  const handleReorder = (newOrder) => {
    if (filterCategory === "all") return; 
    setLocalProducts(newOrder);
    setIsOrderChanged(true);
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    let finalOrderList = [];
    const safeProducts = Array.isArray(products) ? products : []; 

    if (filterCategory === "all") {
        finalOrderList = localProducts;
    } else {
        const otherProducts = safeProducts.filter(p => p.category !== filterCategory);
        const mergedList = [...localProducts, ...otherProducts];

        mergedList.sort((a, b) => {
            const prioA = CATEGORY_PRIORITY[a.category] || 99;
            const prioB = CATEGORY_PRIORITY[b.category] || 99;
            if (prioA !== prioB) return prioA - prioB;
            return 0;
        });
        finalOrderList = mergedList;
    }

    if (reorderProducts) await reorderProducts(finalOrderList);
    setIsOrderChanged(false);
    setIsSavingOrder(false);
  };

  const handleCancelOrder = () => {
    const safeProducts = Array.isArray(products) ? [...products] : [];
    let processed = safeProducts;

    if (filterCategory !== "all") {
        processed = processed.filter(p => p.category === filterCategory).sort((a, b) => a.order - b.order);
    } else {
        processed.sort((a, b) => {
            const prioA = CATEGORY_PRIORITY[a.category] || 99;
            const prioB = CATEGORY_PRIORITY[b.category] || 99;
            return prioA !== prioB ? prioA - prioB : a.order - b.order;
        });
    }
    setLocalProducts(processed);
    setIsOrderChanged(false);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
        await deleteProduct(id);
        const col = collections.find((col) => (col.products || []).some((p) => p._id === id));
        if (col) await removeProductFromCollection(col._id, id);
    } catch (err) { console.error(err); } finally { setDeletingId(null); }
  };

  const handleTogglePreorder = async (product) => {
    const order = ["none", "preorder", "out", "low"];
    const next = order[(order.indexOf(product.isPreOrder) + 1) % 4];
    try { await updateProduct(product._id, { ...product, isPreOrder: next }); } catch (err) { console.error(err); }
  };

  const handleDeleteAll = async () => {
    const safeProducts = Array.isArray(products) ? products : [];
    if (!safeProducts.length) return alert("Trống");
    if (!confirm("Xóa hết?")) return;
    setDeletingAll(true);
    for (const p of safeProducts) {
        try { await deleteProduct(p._id); } catch (e) {}
    }
    setDeletingAll(false);
  };

  return (
    <>
      <motion.div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-6xl mx-auto border border-gray-200 relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Toolbar */}
        <div className="bg-gray-50 border-b px-4 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button onClick={() => setFilterCategory("all")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterCategory === "all" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"}`}>Tất cả</button>
                {categories.map(c => (
                    <button key={c.id} onClick={() => setFilterCategory(c.id)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterCategory === c.id ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"}`}>{c.label}</button>
                ))}
            </div>

            <div className="flex items-center gap-3 ml-auto">
                <AnimatePresence>
                    {isOrderChanged && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-2 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                            <span className="text-xs text-yellow-700 font-medium hidden sm:block">Thứ tự đã đổi</span>
                            <button onClick={handleCancelOrder} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded transition-colors"><RotateCcw className="w-4 h-4" /></button>
                            <button onClick={handleSaveOrder} disabled={isSavingOrder} className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded shadow-sm transition-all flex items-center gap-1 font-bold">{isSavingOrder ? "..." : <><Save className="w-3 h-3" /> Lưu</>}</button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button onClick={handleDeleteAll} disabled={deletingAll || !products?.length} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 flex gap-1 items-center text-xs font-medium transition-all"><Trash className="h-3 w-3" /> Xóa hết</button>
            </div>
        </div>

        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 text-gray-600">
              <tr>{["Sản phẩm", "Giá", "Loại", "Nổi bật", "Trạng thái", "BST", "Hành động", "Kéo"].map((h) => (<th key={h} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">{h}</th>))}</tr>
            </thead>
            <Reorder.Group as="tbody" axis="y" values={localProducts} onReorder={handleReorder} layoutScroll className="bg-white divide-y divide-gray-100">
              {localProducts.map((product) => (
                <ProductRow key={product._id} product={product} categories={categories} collections={collections} toggleFeaturedProduct={toggleFeaturedProduct} handleTogglePreorder={handleTogglePreorder} setEditingProduct={setEditingProduct} handleDelete={handleDelete} deletingId={deletingId} isDraggable={filterCategory !== "all"} />
              ))}
            </Reorder.Group>
          </table>
          {localProducts.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">Không có sản phẩm nào.</div>}
        </div>

        <Reorder.Group axis="y" values={localProducts} onReorder={handleReorder} layoutScroll className="md:hidden grid gap-3 p-3 bg-gray-50">
          {localProducts.map((product) => (
            <ProductCard key={product._id} product={product} categories={categories} collections={collections} toggleFeaturedProduct={toggleFeaturedProduct} handleTogglePreorder={handleTogglePreorder} setEditingProduct={setEditingProduct} handleDelete={handleDelete} deletingId={deletingId} isDraggable={filterCategory !== "all"} />
          ))}
          {localProducts.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">Không có sản phẩm.</div>}
        </Reorder.Group>
      </motion.div>

      {editingProduct && <EditProductModal product={editingProduct} collections={collections} onClose={() => setEditingProduct(null)} />}
    </>
  );
};

export default ProductsList;