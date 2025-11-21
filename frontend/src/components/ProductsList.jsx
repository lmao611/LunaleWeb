import { useState, useEffect, useRef } from "react";
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

const EditProductModal = ({ product, collections, onClose }) => {
  const { updateProduct } = useProductStore();
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
  });
  const [uploadingThumbIndex, setUploadingThumbIndex] = useState(null);
  const [uploadingMain, setUploadingMain] = useState(false);

  useEffect(() => {
    if (product) {
      const currentCol = collections.find((col) =>
        (col.products || []).some((p) => p._id === product._id)
      );

      setFormData({
        name: product.name || "",
        price: product.price || 0,
        category: product.category || "",
        image: product.image || "",
        thumbnails: product.thumbnails || [],
        description: product.description || "",
        productLink: product.productLink || "",
        collectionId: currentCol?._id || "",
        isPreOrder: product.isPreOrder || "none",
      });
    }
  }, [product, collections]);

  const handleMainImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingMain(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      try {
        const res = await axios.put(`/api/products/${product._id}`, {
          ...formData,
          image: base64Image,
        });
        setFormData({ ...formData, image: res.data.image });
      } catch (err) {
        alert("Không thể cập nhật ảnh chính");
      } finally {
        setUploadingMain(false);
      }
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

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formDataCloud }
      );
      const data = await uploadRes.json();
      if (!data.secure_url) throw new Error("No secure_url returned");

      const newThumbs = [...formData.thumbnails];
      newThumbs[index] = data.secure_url;
      setFormData({ ...formData, thumbnails: newThumbs });
    } catch (err) {
      alert("Không thể upload thumbnail");
    } finally {
      setUploadingThumbIndex(null);
    }
  };

  const addThumbnail = () => setFormData({ ...formData, thumbnails: [...formData.thumbnails, ""] });
  const removeThumbnail = (index) => {
    const newThumbs = formData.thumbnails.filter((_, i) => i !== index);
    setFormData({ ...formData, thumbnails: newThumbs });
  };

  const handleSave = async () => {
    try {
      await updateProduct(product._id, formData);

      const oldCol = collections.find((col) =>
        (col.products || []).some((p) => p._id === product._id)
      );

      if (oldCol && oldCol._id !== formData.collectionId) {
        await removeProductFromCollection(oldCol._id, product._id);
      }

      if (formData.collectionId && (!oldCol || oldCol._id !== formData.collectionId)) {
        await addProductToCollection(formData.collectionId, product);
      }

      alert("Cập nhật sản phẩm thành công");
      onClose();
    } catch (err) {
      alert("Lỗi khi cập nhật sản phẩm");
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-10 sm:pt-20 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-lg shadow-xl space-y-4 overflow-y-auto max-h-[95vh] sm:max-h-[90vh]"
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-2 text-blue-800">
          ⚙️ Chỉnh sửa: {product.name}
        </h2>

        <input
          type="text"
          placeholder="Tên sản phẩm"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border p-2 rounded text-sm sm:text-base"
        />

        <input
          type="number"
          placeholder="Giá (VNĐ)"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          className="w-full border p-2 rounded text-sm sm:text-base"
        />

        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full border p-2 rounded text-sm sm:text-base"
        >
          <option value="">Chọn loại sản phẩm</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          value={formData.collectionId}
          onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
          className="w-full border p-2 rounded text-sm sm:text-base"
        >
          <option value="">Chọn bộ sưu tập</option>
          {collections.map((col) => (
            <option key={col._id} value={col._id}>
              {col.name}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Mô tả sản phẩm"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full border p-2 rounded h-24 resize-none text-sm sm:text-base"
        />

        {formData.category === "feedback" && (
          <input
            type="text"
            placeholder="Link sản phẩm (chỉ dành cho feedback)"
            value={formData.productLink}
            onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
            className="w-full border p-2 rounded text-sm sm:text-base"
          />
        )}

        <div className="flex flex-col gap-1 mt-2">
          <label className="text-sm font-medium">Trạng thái sản phẩm</label>
          <div
            onClick={() => {
              const order = ["none", "preorder", "out", "low"];
              const next = order[(order.indexOf(formData.isPreOrder) + 1) % order.length];
              setFormData({ ...formData, isPreOrder: next });
            }}
            className={`cursor-pointer px-3 py-2 rounded text-center text-sm font-medium transition-all duration-200
              ${
                formData.isPreOrder === "preorder"
                  ? "bg-purple-500 text-white"
                  : formData.isPreOrder === "out"
                  ? "bg-red-500 text-white"
                  : formData.isPreOrder === "low"
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-gray-200 text-gray-700"
              }`}
          >
            {formData.isPreOrder === "none"
              ? "None"
              : formData.isPreOrder === "preorder"
              ? "Pre-Order"
              : formData.isPreOrder === "out"
              ? "Hết hàng"
              : "Số lượng còn ít"}
          </div>
        </div>

        <div className="space-y-2 mt-2">
          <label className="block font-medium text-sm sm:text-base">Ảnh chính</label>
          {formData.image && (
            <img
              src={formData.image}
              alt="preview"
              className="w-full h-36 sm:h-40 object-cover rounded"
            />
          )}
          <input type="file" accept="image/*" onChange={handleMainImageChange} disabled={uploadingMain} />
          {uploadingMain && <p className="text-sm text-gray-500">Đang upload...</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm sm:text-base">Ảnh phụ</span>
            <button onClick={addThumbnail} className="text-sm text-blue-600 hover:text-blue-400">
              + Thêm ảnh
            </button>
          </div>
          {formData.thumbnails.map((thumb, index) => (
            <div key={index} className="flex gap-2 mb-2 items-center flex-wrap">
              {thumb && (
                <img
                  src={thumb}
                  alt={`thumb-${index}`}
                  className="w-16 h-16 object-cover rounded border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleThumbnailChange(e, index)}
                disabled={uploadingThumbIndex === index}
              />
              <button onClick={() => removeThumbnail(index)} className="text-red-500 hover:text-red-400">
                <Trash className="w-5 h-5" />
              </button>
              {uploadingThumbIndex === index && (
                <p className="text-xs text-gray-500">Đang upload...</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 w-full sm:w-auto">
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full sm:w-auto"
          >
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProductRow = ({ product, categories, collections, toggleFeaturedProduct, handleTogglePreorder, setEditingProduct, handleDelete, deletingId }) => {
  const controls = useDragControls();
  const col = collections.find((col) => (col.products || []).some((p) => p._id === product._id));
  const categoryLabel = categories.find((c) => c.id === product.category)?.label || product.category;
  
  const scrollInterval = useRef(null);

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const handleDrag = (e, info) => {
    // ⚡️ SỬ DỤNG e.clientY ĐỂ LẤY TOẠ ĐỘ VIEWPORT CHÍNH XÁC
    const clientY = e.clientY; 
    const threshold = 80; // Giảm vùng kích hoạt còn 80px để đỡ nhạy
    const speed = 15;
    const viewportHeight = window.innerHeight;

    // Kéo lên gần đỉnh (Top)
    if (clientY < threshold) {
      if (!scrollInterval.current) {
        scrollInterval.current = setInterval(() => {
          window.scrollBy({ top: -speed, behavior: "auto" });
        }, 10);
      }
    } 
    // Kéo xuống gần đáy (Bottom)
    else if (clientY > viewportHeight - threshold) {
      if (!scrollInterval.current) {
        scrollInterval.current = setInterval(() => {
          window.scrollBy({ top: speed, behavior: "auto" });
        }, 10);
      }
    } 
    // Ở vùng an toàn
    else {
      stopAutoScroll();
    }
  };

  const statusColor =
    product.isPreOrder === "preorder"
      ? "bg-purple-500 text-white"
      : product.isPreOrder === "out"
      ? "bg-red-500 text-white"
      : product.isPreOrder === "low"
      ? "bg-yellow-400 text-gray-900"
      : "bg-gray-200 text-gray-700";

  const statusLabel =
    product.isPreOrder === "preorder"
      ? "Pre-Order"
      : product.isPreOrder === "out"
      ? "Hết hàng"
      : product.isPreOrder === "low"
      ? "Số lượng còn ít"
      : "None";

  return (
    <Reorder.Item
      as="tr"
      value={product}
      dragListener={false}
      dragControls={controls}
      onDrag={handleDrag}        
      onDragEnd={stopAutoScroll} 
      className="hover:bg-blue-50 transition-colors duration-200 select-none"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            className="h-10 w-10 rounded-full object-cover border"
            src={product.image}
            alt={product.name}
          />
          <div className="ml-4 text-sm font-medium text-gray-900">{product.name}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{product.price.toLocaleString()} ₫</td>
      <td className="px-6 py-4 whitespace-nowrap">{categoryLabel}</td>

      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => toggleFeaturedProduct(product._id)}
          className={`p-1 rounded-full ${
            product.isFeatured
              ? "bg-yellow-400 text-gray-900"
              : "bg-gray-200 text-gray-500"
          } hover:scale-105 transition-transform`}
        >
          <Star className="h-5 w-5" />
        </button>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => handleTogglePreorder(product)}
          className={`px-3 py-1 rounded text-xs font-medium ${statusColor}`}
        >
          {statusLabel}
        </button>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {col ? col.name : "—"}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-3 text-sm font-medium">
          <button onClick={() => setEditingProduct(product)} className="text-gray-700 hover:text-blue-600">
            <Settings className="h-5 w-5" />
          </button>
          {deletingId === product._id ? (
            <span className="text-gray-400 italic">Đang xóa...</span>
          ) : (
            <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-400">
              <Trash className="h-5 w-5" />
            </button>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded text-gray-500 flex justify-center items-center"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      </td>
    </Reorder.Item>
  );
};

const ProductCard = ({ product, categories, collections, toggleFeaturedProduct, handleTogglePreorder, setEditingProduct, handleDelete, deletingId }) => {
  const controls = useDragControls();
  const col = collections.find((col) => (col.products || []).some((p) => p._id === product._id));
  const cat = categories.find((c) => c.id === product.category)?.label || product.category;

  const scrollInterval = useRef(null);

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const handleDrag = (e, info) => {
    // ⚡️ SỬ DỤNG e.clientY
    const clientY = e.clientY;
    const threshold = 80;
    const speed = 15;
    const viewportHeight = window.innerHeight;

    if (clientY < threshold) {
      if (!scrollInterval.current) {
        scrollInterval.current = setInterval(() => window.scrollBy({ top: -speed, behavior: "auto" }), 10);
      }
    } else if (clientY > viewportHeight - threshold) {
      if (!scrollInterval.current) {
        scrollInterval.current = setInterval(() => window.scrollBy({ top: speed, behavior: "auto" }), 10);
      }
    } else {
      stopAutoScroll();
    }
  };

  const statusColor =
    product.isPreOrder === "preorder"
      ? "bg-purple-500 text-white"
      : product.isPreOrder === "out"
      ? "bg-red-500 text-white"
      : product.isPreOrder === "low"
      ? "bg-yellow-400 text-gray-900"
      : "bg-gray-200 text-gray-700";

  const statusLabel =
    product.isPreOrder === "preorder"
      ? "Pre-Order"
      : product.isPreOrder === "out"
      ? "Hết hàng"
      : product.isPreOrder === "low"
      ? "Số lượng còn ít"
      : "None";

  return (
    <Reorder.Item
      value={product}
      dragListener={false}
      dragControls={controls}
      onDrag={handleDrag}       
      onDragEnd={stopAutoScroll}
      className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm bg-white select-none"
    >
      <img src={product.image} alt={product.name} className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded" />
      <div className="flex-1">
        <h3 className="font-semibold text-base text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-500">{cat}</p>
        <p className="text-blue-700 font-semibold">{product.price.toLocaleString()} ₫</p>
        <p className="text-xs text-gray-400">{col ? col.name : "—"}</p>
        <button
          onClick={() => handleTogglePreorder(product)}
          className={`mt-1 px-2 py-1 rounded text-xs font-medium ${statusColor}`}
        >
          {statusLabel}
        </button>
      </div>

      <div className="flex justify-between items-center gap-3 mt-2 sm:mt-0 border-t pt-2 sm:border-t-0 sm:pt-0 sm:flex-col sm:border-l sm:pl-3">
        <div className="flex gap-2">
          <button
            onClick={() => toggleFeaturedProduct(product._id)}
            className={`p-2 rounded-full ${
              product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-200 text-gray-500"
            }`}
          >
            <Star className="h-5 w-5" />
          </button>
          <button onClick={() => setEditingProduct(product)} className="p-2 bg-blue-100 text-blue-600 rounded-full">
            <Settings className="h-5 w-5" />
          </button>
          <button onClick={() => handleDelete(product._id)} className="p-2 bg-red-100 text-red-500 rounded-full">
            {deletingId === product._id ? "…" : <Trash className="h-5 w-5" />}
          </button>
        </div>

        <div className="ml-auto sm:ml-0">
          <div
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded text-gray-500 flex justify-center items-center"
          >
            <GripVertical className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
};

const ProductsList = () => {
  const { products, deleteProduct, toggleFeaturedProduct, updateProduct, reorderProducts } = useProductStore();
  const { collections, fetchCollections, removeProductFromCollection } = useCollectionStore();

  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [localProducts, setLocalProducts] = useState([]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const handleReorder = (newOrder) => {
    setLocalProducts(newOrder);
    if (reorderProducts) {
      reorderProducts(newOrder);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      const col = collections.find((col) => (col.products || []).some((p) => p._id === id));
      if (col) await removeProductFromCollection(col._id, id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePreorder = async (product) => {
    const order = ["none", "preorder", "out", "low"];
    const next = order[(order.indexOf(product.isPreOrder) + 1) % order.length];
    try {
      await updateProduct(product._id, { ...product, isPreOrder: next });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!products.length) return alert("Không có sản phẩm để xóa.");
    if (!confirm("⚠️ Bạn có chắc muốn xóa tất cả sản phẩm?")) return;
    setDeletingAll(true);

    for (const p of products) {
      try {
        await deleteProduct(p._id);
        const col = collections.find((col) => (col.products || []).some((p) => p._id === p._id));
        if (col) await removeProductFromCollection(col._id, p._id);
      } catch (err) {
        console.error(err);
      }
    }

    setDeletingAll(false);
    alert("Đã xóa tất cả sản phẩm");
  };

  return (
    <>
      <motion.div
        className="bg-white shadow-lg rounded-lg overflow-hidden max-w-6xl mx-auto border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex justify-end px-4 sm:px-6 pt-2">
          <button
            onClick={handleDeleteAll}
            disabled={deletingAll || products.length === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              deletingAll || products.length === 0
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all duration-150"
            }`}
          >
            <Trash className="h-4 w-4" />
            {deletingAll ? "Đang xóa..." : "Xóa tất cả"}
          </button>
        </div>

        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-900">
              <tr>
                {["Sản phẩm", "Giá", "Loại", "Nổi bật", "Trạng thái", "Bộ sưu tập", "Hành động", "Sắp xếp"].map((col) => (
                  <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <Reorder.Group as="tbody" axis="y" values={localProducts} onReorder={handleReorder} className="bg-white divide-y divide-gray-200">
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
                />
              ))}
            </Reorder.Group>
          </table>
        </div>

        <Reorder.Group axis="y" values={localProducts} onReorder={handleReorder} className="md:hidden grid gap-4 p-4">
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
            />
          ))}
        </Reorder.Group>
      </motion.div>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          collections={collections}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </>
  );
};

export default ProductsList;