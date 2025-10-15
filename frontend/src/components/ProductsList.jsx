import { motion } from "framer-motion";
import { Trash, Star, Settings } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCollectionStore } from "../stores/useCollectionStore";
import { useState, useEffect } from "react";
import axios from "axios";

// ✅ Đồng bộ category với CreateProductForm
const categories = [
  { id: "dress", label: "Đầm nữ" },
  { id: "shirt", label: "Áo nữ" },
  { id: "set", label: "Đồ bộ" },
  { id: "feedback", label: "Feedback" },
];

const ProductsList = () => {
  const { deleteProduct, toggleFeaturedProduct, updateProduct, products } =
    useProductStore();
  const { collections, fetchCollections, removeProductFromCollection } =
    useCollectionStore();

  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    thumbnails: [],
    description: "",
    productLink: "",
  });

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const findCollectionByProductId = (productId) =>
    collections.find((col) => (col.products || []).some((p) => p._id === productId)) ||
    null;

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      price: product.price || "",
      category: product.category || "",
      image: product.image || "",
      thumbnails: product.thumbnails || [],
      description: product.description || "",
      productLink: product.productLink || "",
    });
  };

  // 🟢 Khi đổi ảnh chính → gửi ảnh base64 cho backend
  const handleMainImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;

      try {
        const res = await axios.put(`/api/products/${editingProduct._id}`, {
          ...formData,
          image: base64Image, // gửi base64 sang backend
        });

        setFormData({ ...formData, image: res.data.image }); // cập nhật link ảnh mới
        alert("✅ Ảnh chính đã được cập nhật!");
      } catch (err) {
        console.error("❌ Upload ảnh chính lỗi:", err);
        alert("Không thể cập nhật ảnh chính.");
      }
    };
    reader.readAsDataURL(file);
  };

  // 🖼️ Ảnh phụ giữ nguyên upload trực tiếp Cloudinary
  const handleThumbnailChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      const newThumbs = [...formData.thumbnails];
      newThumbs[index] = base64Image;
      setFormData({ ...formData, thumbnails: newThumbs });
    };
    reader.readAsDataURL(file);
  };

  const addThumbnail = () => {
    setFormData({ ...formData, thumbnails: [...formData.thumbnails, ""] });
  };

  const removeThumbnail = async (index) => {
    const newThumbs = formData.thumbnails.filter((_, i) => i !== index);
    setFormData({ ...formData, thumbnails: newThumbs });
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    try {
      const res = await axios.put(`/api/products/${editingProduct._id}`, formData);
      alert("✅ Cập nhật sản phẩm thành công!");
      setEditingProduct(null);
    } catch (err) {
      console.error("❌ Lỗi cập nhật sản phẩm:", err);
      alert("❌ Lỗi khi cập nhật sản phẩm. Xem console để biết thêm.");
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      const col = findCollectionByProductId(id);
      if (col) await removeProductFromCollection(col._id, id);
    } catch (err) {
      console.error("❌ Xóa thất bại:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!products.length) return alert("Không có sản phẩm để xóa.");
    if (!confirm("⚠️ Bạn có chắc muốn xóa tất cả sản phẩm?")) return;
    setDeletingAll(true);

    for (const p of products) {
      try {
        await deleteProduct(p._id);
        const col = findCollectionByProductId(p._id);
        if (col) await removeProductFromCollection(col._id, p._id);
      } catch (err) {
        console.error(`❌ Lỗi khi xóa ${p.name}:`, err);
      }
    }

    setDeletingAll(false);
    alert("✅ Đã xóa tất cả sản phẩm");
  };

  return (
    <>
      <motion.div
        className="bg-white shadow-lg rounded-lg overflow-hidden max-w-5xl mx-auto border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* 🗑️ Nút xóa tất cả */}
        <div className="flex justify-end px-6 pt-2">
          <button
            onClick={handleDeleteAll}
            disabled={deletingAll || products.length === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2
              ${
                deletingAll || products.length === 0
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all duration-150"
              }`}
          >
            <Trash className="h-4 w-4" />
            {deletingAll ? "Đang xóa..." : "Xóa tất cả"}
          </button>
        </div>

        {/* 🧾 Danh sách sản phẩm */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              {["Sản phẩm", "Giá", "Loại", "Nổi bật", "Bộ sưu tầm", "Hành động"].map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-semibold text-white uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {products?.map((product) => {
              const col = findCollectionByProductId(product._id);
              const categoryLabel =
                categories.find((c) => c.id === product.category)?.label ||
                product.category;
              return (
                <tr key={product._id} className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full object-cover border"
                        src={product.image}
                        alt={product.name}
                      />
                      <div className="ml-4 text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.price.toLocaleString()} ₫
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {col ? col.name : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-3 text-sm font-medium">
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-gray-700 hover:text-blue-600"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    {deletingId === product._id ? (
                      <span className="text-gray-400 italic">Đang xóa...</span>
                    ) : (
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* ⚙️ Modal chỉnh sửa */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 pt-23">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl space-y-4 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-2">
              ⚙️ Chỉnh sửa: {editingProduct.name}
            </h2>

            <input
              type="text"
              placeholder="Tên sản phẩm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border p-2 rounded"
            />

            <input
              type="number"
              placeholder="Giá (VNĐ)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full border p-2 rounded"
            />

            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option value="">Chọn loại sản phẩm</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Mô tả sản phẩm"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border p-2 rounded h-24 resize-none"
            />

            {/* Ảnh chính */}
            <div className="space-y-2">
              <label className="block font-medium">Ảnh chính</label>
              {formData.image && (
                <img src={formData.image} alt="preview" className="w-full h-40 object-cover rounded" />
              )}
              <input type="file" accept="image/*" onChange={handleMainImageChange} className="w-full" />
            </div>

            {/* Ảnh phụ */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Ảnh phụ</span>
                <button onClick={addThumbnail} className="text-sm text-blue-600 hover:text-blue-400">
                  + Thêm ảnh
                </button>
              </div>
              {formData.thumbnails.map((thumb, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  {thumb && (
                    <img
                      src={thumb}
                      alt={`thumb-${index}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleThumbnailChange(e, index)} />
                  <button onClick={() => removeThumbnail(index)} className="text-red-500 hover:text-red-400">
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {formData.category === "feedback" && (
              <input
                type="text"
                placeholder="Link sản phẩm (chỉ dành cho feedback)"
                value={formData.productLink}
                onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                className="w-full border p-2 rounded"
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductsList;
