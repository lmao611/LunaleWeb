import { useState, useEffect, useRef, useCallback } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { Trash, Star, Settings, GripVertical } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCollectionStore } from "../stores/useCollectionStore";
import axios from "axios";

const categories = [
  { id: "dress", label: "Đầm nữ" },
  { id: "shirt", label: "Áo nữ" },
  { id: "set", label: "Đồ bộ" },
  { id: "feedback", label: "Feedback" },
];

// -------------------- COMPONENT ROW (DESKTOP) --------------------
const ProductRow = ({ product, categories, collections, toggleFeaturedProduct, handleTogglePreorder, setEditingProduct, handleDelete, deletingId, onDragStart, onDragEnd }) => {
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
      dragListener={false}
      dragControls={controls}
      onDrag={(e, info) => onDragStart(e, info)} // Gọi hàm xử lý cuộn từ cha
      onDragEnd={onDragEnd}
      className="hover:bg-blue-50 transition-colors duration-200 select-none relative bg-white"
      whileDrag={{
        scale: 1.02,
        boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
        backgroundColor: "#f0f9ff",
        zIndex: 50,
      }}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img className="h-10 w-10 rounded-full object-cover border" src={product.image} alt={product.name} />
          <div className="ml-4 text-sm font-medium text-gray-900">{product.name}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{product.price.toLocaleString()} ₫</td>
      <td className="px-6 py-4 whitespace-nowrap">{categoryLabel}</td>

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
          {deletingId === product._id ? <span className="text-gray-400 italic">Đang xóa...</span> : 
            <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-400"><Trash className="h-5 w-5" /></button>}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div onPointerDown={(e) => controls.start(e)} className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded text-gray-500 flex justify-center items-center">
          <GripVertical className="h-5 w-5" />
        </div>
      </td>
    </Reorder.Item>
  );
};

// -------------------- COMPONENT CARD (MOBILE) --------------------
const ProductCard = ({ product, categories, collections, toggleFeaturedProduct, handleTogglePreorder, setEditingProduct, handleDelete, deletingId, onDragStart, onDragEnd }) => {
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
      dragListener={false}
      dragControls={controls}
      onDrag={(e, info) => onDragStart(e, info)}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
      className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm bg-white select-none touch-none"
    >
      <img src={product.image} alt={product.name} className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded" />
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
        <div className="ml-auto sm:ml-0">
          <div onPointerDown={(e) => controls.start(e)} className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded text-gray-500 flex justify-center items-center">
            <GripVertical className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
};

const EditProductModal = ({ product, collections, onClose }) => {
  const { updateProduct } = useProductStore();
  const { addProductToCollection, removeProductFromCollection } = useCollectionStore();

  const [formData, setFormData] = useState({
    name: "", price: "", category: "", image: "", thumbnails: [], description: "", productLink: "", collectionId: "", isPreOrder: "none",
  });
  const [uploadingThumbIndex, setUploadingThumbIndex] = useState(null);
  const [uploadingMain, setUploadingMain] = useState(false);

  useEffect(() => {
    if (product) {
      const currentCol = collections.find((col) => (col.products || []).some((p) => p._id === product._id));
      setFormData({
        name: product.name || "", price: product.price || 0, category: product.category || "", image: product.image || "", thumbnails: product.thumbnails || [], description: product.description || "", productLink: product.productLink || "", collectionId: currentCol?._id || "", isPreOrder: product.isPreOrder || "none",
      });
    }
  }, [product, collections]);

  const handleMainImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingMain(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await axios.put(`/api/products/${product._id}`, { ...formData, image: reader.result });
        setFormData({ ...formData, image: res.data.image });
      } catch { alert("Lỗi update ảnh"); } finally { setUploadingMain(false); }
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
      const newThumbs = [...formData.thumbnails]; newThumbs[index] = data.secure_url;
      setFormData({ ...formData, thumbnails: newThumbs });
    } catch { alert("Lỗi upload thumb"); } finally { setUploadingThumbIndex(null); }
  };

  const handleSave = async () => {
    try {
      await updateProduct(product._id, formData);
      const oldCol = collections.find((col) => (col.products || []).some((p) => p._id === product._id));
      if (oldCol && oldCol._id !== formData.collectionId) await removeProductFromCollection(oldCol._id, product._id);
      if (formData.collectionId && (!oldCol || oldCol._id !== formData.collectionId)) await addProductToCollection(formData.collectionId, product);
      onClose();
    } catch { alert("Lỗi update sản phẩm"); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-10 sm:pt-20 z-50">
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
        {formData.category === "feedback" && <input type="text" value={formData.productLink} onChange={(e) => setFormData({ ...formData, productLink: e.target.value })} className="w-full border p-2 rounded" placeholder="Link sản phẩm" />}
        
        <div className="flex flex-col gap-1 mt-2">
          <label className="text-sm font-medium">Trạng thái</label>
          <div onClick={() => { const o = ["none", "preorder", "out", "low"]; setFormData({ ...formData, isPreOrder: o[(o.indexOf(formData.isPreOrder) + 1) % 4] }); }} className="cursor-pointer px-3 py-2 rounded bg-gray-200 text-center text-sm font-medium">
            {formData.isPreOrder}
          </div>
        </div>

        <div className="space-y-2 mt-2">
            <label className="block font-medium text-sm">Ảnh chính</label>
            {formData.image && <img src={formData.image} className="w-full h-40 object-cover rounded" alt="main" />}
            <input type="file" onChange={handleMainImageChange} disabled={uploadingMain} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Hủy</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Lưu</button>
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
  const [localProducts, setLocalProducts] = useState([]);

  // ⚡️⚡️⚡️ NEW SCROLL LOGIC ⚡️⚡️⚡️
  const scrollVelocity = useRef(0); // Tốc độ cuộn hiện tại
  const isDragging = useRef(false); // Trạng thái đang kéo
  const frameId = useRef(null); // ID của requestAnimationFrame

  useEffect(() => { fetchCollections(); }, [fetchCollections]);
  useEffect(() => { setLocalProducts(products); }, [products]);

  // Hàm vòng lặp cuộn mượt (Game Loop style)
  const processScroll = () => {
    if (isDragging.current && scrollVelocity.current !== 0) {
      window.scrollBy(0, scrollVelocity.current);
      frameId.current = requestAnimationFrame(processScroll);
    } else {
      frameId.current = null;
    }
  };

  // Xử lý khi kéo (tính toán tốc độ dựa trên vị trí)
  const handleDragStart = useCallback((e, info) => {
    isDragging.current = true;
    const clientY = e.clientY; // Vị trí chuột trên viewport
    const h = window.innerHeight;
    const threshold = 150; // Vùng kích hoạt rộng hơn chút (150px) để dễ bắt
    const maxSpeed = 25; // Tốc độ tối đa

    // Nếu ở vùng trên
    if (clientY < threshold) {
      // Càng sát mép trên (clientY -> 0), tốc độ âm càng lớn
      const intensity = 1 - clientY / threshold; 
      scrollVelocity.current = -maxSpeed * intensity; 
      if (!frameId.current) processScroll();
    } 
    // Nếu ở vùng dưới
    else if (clientY > h - threshold) {
      // Càng sát mép dưới, tốc độ dương càng lớn
      const intensity = (clientY - (h - threshold)) / threshold;
      scrollVelocity.current = maxSpeed * intensity;
      if (!frameId.current) processScroll();
    } 
    // Vùng an toàn
    else {
      scrollVelocity.current = 0;
    }
  }, []);

  // Dừng cuộn khi thả chuột
  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    scrollVelocity.current = 0;
    if (frameId.current) {
      cancelAnimationFrame(frameId.current);
      frameId.current = null;
    }
  }, []);

  const handleReorder = (newOrder) => {
    setLocalProducts(newOrder);
    if (reorderProducts) reorderProducts(newOrder);
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
    if (!products.length) return alert("Trống");
    if (!confirm("Xóa hết?")) return;
    setDeletingAll(true);
    for (const p of products) {
        try { await deleteProduct(p._id); } catch (e) {}
    }
    setDeletingAll(false);
  };

  return (
    <>
      <motion.div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-6xl mx-auto border border-gray-200" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-end px-4 sm:px-6 pt-2">
          <button onClick={handleDeleteAll} disabled={deletingAll || !products.length} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 flex gap-2 items-center">
            <Trash className="h-4 w-4" /> Xóa tất cả
          </button>
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-900 text-white">
              <tr>
                {["Sản phẩm", "Giá", "Loại", "Nổi bật", "Trạng thái", "BST", "Hành động", "Sắp xếp"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            {/* 🟢 Thêm layoutScroll để fix lỗi render vị trí khi scroll */}
            <Reorder.Group as="tbody" axis="y" values={localProducts} onReorder={handleReorder} layoutScroll className="bg-white divide-y divide-gray-200">
              {localProducts.map((product) => (
                <ProductRow
                  key={product._id}
                  product={product}
                  categories={categories}
                  collections={collections}
                  toggleFeaturedProduct={toggleFeaturedProduct}
                  handleTogglePreorder={handleTogglePreorder}
                  setEditingProduct={setEditingProduct}
                  handleDelete={handleDelete}
                  deletingId={deletingId}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </Reorder.Group>
          </table>
        </div>

        {/* MOBILE VIEW */}
        <Reorder.Group axis="y" values={localProducts} onReorder={handleReorder} layoutScroll className="md:hidden grid gap-4 p-4">
          {localProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              categories={categories}
              collections={collections}
              toggleFeaturedProduct={toggleFeaturedProduct}
              handleTogglePreorder={handleTogglePreorder}
              setEditingProduct={setEditingProduct}
              handleDelete={handleDelete}
              deletingId={deletingId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
        </Reorder.Group>
      </motion.div>

      {editingProduct && <EditProductModal product={editingProduct} collections={collections} onClose={() => setEditingProduct(null)} />}
    </>
  );
};

export default ProductsList;