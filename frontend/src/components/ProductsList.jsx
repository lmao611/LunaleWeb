import { motion } from "framer-motion";
import { Trash, Star, Pencil } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCollectionStore } from "../stores/useCollectionStore";
import { useState, useEffect } from "react";

const ProductsList = () => {
  const { deleteProduct, toggleFeaturedProduct, updateProduct, products } =
    useProductStore();
  const {
    collections,
    fetchCollections,
    addProductToCollection,
    removeProductFromCollection,
  } = useCollectionStore();

  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // 👈 sản phẩm đang chỉnh
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    subImages: [],
    description: "",
  });

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const findCollectionByProductId = (productId) => {
    return (
      collections.find((col) =>
        (col.products || []).some((p) => p._id === productId)
      ) || null
    );
  };

  const handleAddToCollection = async (product, collectionId) => {
    if (!collectionId) return;
    const current = findCollectionByProductId(product._id);

    if (current && current._id !== collectionId) {
      const target = collections.find((c) => c._id === collectionId);
      if (
        !confirm(
          `Sản phẩm đang nằm trong "${current.name}". Di chuyển sang "${target.name}"?`
        )
      )
        return;
      await removeProductFromCollection(current._id, product._id);
      await addProductToCollection(collectionId, {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
      });
      alert(`✅ Đã di chuyển ${product.name} sang "${target.name}"`);
      return;
    }

    await addProductToCollection(collectionId, {
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
    });
    const target = collections.find((c) => c._id === collectionId);
    alert(`✅ Đã thêm ${product.name} vào "${target.name}"`);
  };

  const handleRemoveFromCollection = async (product) => {
    const col = findCollectionByProductId(product._id);
    if (!col) return;
    await removeProductFromCollection(col._id, product._id);
    alert(`✅ Đã bỏ ${product.name} khỏi "${col.name}"`);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      const col = findCollectionByProductId(id);
      if (col) {
        await removeProductFromCollection(col._id, id);
      }
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

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      price: product.price || "",
      category: product.category || "",
      image: product.image || "",
      subImages: product.subImages || [],
      description: product.description || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    await updateProduct(editingProduct._id, formData);
    setEditingProduct(null);
    alert("✅ Cập nhật sản phẩm thành công!");
  };

  const handleSubImageChange = (e, index) => {
    const newSubImages = [...formData.subImages];
    newSubImages[index] = e.target.value;
    setFormData({ ...formData, subImages: newSubImages });
  };

  const addSubImage = () => {
    setFormData({ ...formData, subImages: [...formData.subImages, ""] });
  };

  const removeSubImage = (index) => {
    const newSubImages = formData.subImages.filter((_, i) => i !== index);
    setFormData({ ...formData, subImages: newSubImages });
  };

  return (
    <>
      <motion.div
        className="bg-white shadow-lg rounded-lg overflow-hidden max-w-5xl mx-auto border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* ✅ Xóa tất cả */}
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

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Nổi bật
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Bộ sưu tầm
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {products?.map((product) => {
              const col = findCollectionByProductId(product._id);
              return (
                <tr
                  key={product._id}
                  className="hover:bg-blue-50 transition-colors duration-200"
                >
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

                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.category}
                  </td>

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
                    {col ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 font-medium">
                          {col.name}
                        </span>
                        <button
                          className="text-sm text-red-500 hover:text-red-400 ml-2"
                          onClick={() => handleRemoveFromCollection(product)}
                        >
                          Bỏ
                        </button>
                      </div>
                    ) : (
                      <select
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;
                          handleAddToCollection(product, value);
                          e.target.value = "";
                        }}
                        defaultValue=""
                        className="border border-gray-300 rounded-md py-1 px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">+ Thêm vào bộ sưu tầm</option>
                        {collections.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-blue-600 hover:text-blue-400"
                    >
                      <Pencil className="h-5 w-5" />
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

      {/* 🛠️ Modal chỉnh sửa */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl space-y-4">
            <h2 className="text-xl font-semibold mb-2">
              ✏️ Chỉnh sửa: {editingProduct.name}
            </h2>
            <input
              type="text"
              placeholder="Tên sản phẩm"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Giá"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Loại"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Ảnh chính URL"
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Ảnh phụ</span>
                <button
                  onClick={addSubImage}
                  className="text-sm text-blue-600 hover:text-blue-400"
                >
                  + Thêm ảnh
                </button>
              </div>
              {formData.subImages.map((img, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={img}
                    onChange={(e) => handleSubImageChange(e, index)}
                    className="w-full border p-2 rounded"
                    placeholder={`URL ảnh phụ ${index + 1}`}
                  />
                  <button
                    onClick={() => removeSubImage(index)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <textarea
              placeholder="Mô tả sản phẩm"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border p-2 rounded h-24 resize-none"
            />
            <div className="flex justify-end gap-2">
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
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductsList;
