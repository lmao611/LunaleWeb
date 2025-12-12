import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader, Images, Link as LinkIcon, Tag } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCollectionStore } from "../stores/useCollectionStore"; // ✅ 1. Import Store Collection

const categories = [
  { id: "dress", label: "Đầm nữ" },
  { id: "shirt", label: "Áo nữ" },
  { id: "set", label: "Đồ bộ" },
  { id: "feedback", label: "Feedback" },
];

const CreateProductForm = () => {
  const { createProduct, loading } = useProductStore();
  const { collections, fetchCollections, addProductToCollection } = useCollectionStore(); // ✅ 2. Lấy hàm từ Store

  // ✅ 3. Load danh sách Collection khi trang tải xong
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    thumbnails: [],
    productLink: "",
    isSale: false,
    salePercentage: "",
    collectionId: "", // ✅ 4. State lưu ID collection được chọn
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Gọi hàm tạo sản phẩm và đợi kết quả trả về (ID sản phẩm mới)
      const createdProduct = await createProduct(newProduct);
      
      // ✅ 5. Nếu tạo thành công và có chọn Collection -> Thêm sản phẩm vào Collection đó
      if (createdProduct && createdProduct._id && newProduct.collectionId) {
          await addProductToCollection(newProduct.collectionId, createdProduct);
      }

      // Reset form
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        image: "",
        thumbnails: [],
        productLink: "",
        isSale: false,
        salePercentage: "",
        collectionId: "",
      });
    } catch (error) {
      console.error("Lỗi khi tạo sản phẩm:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThumbnailsChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct((prev) => ({
          ...prev,
          thumbnails: [...prev.thumbnails, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-md rounded-lg p-8 mb-8 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-blue-700">
        Thêm sản phẩm mới
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Tên sản phẩm */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
          <input
            type="text"
            id="name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="Nhập tên sản phẩm..."
          />
        </div>

        {/* Mô tả */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            id="description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="Mô tả chi tiết..."
          />
        </div>

        {/* Giá */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Giá (VND)</label>
          <input
            type="number"
            id="price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="0"
          />
        </div>

        {/* --- GRID: LOẠI SẢN PHẨM & BỘ SƯU TẬP --- */}
        <div className="grid grid-cols-2 gap-4">
            {/* Loại sản phẩm */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Loại sản phẩm</label>
              <select
                id="category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Chọn loại --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* ✅ DROPDOWN COLLECTION (Đã kiểm tra hiển thị) */}
            <div>
              <label htmlFor="collection" className="block text-sm font-medium text-gray-700">Thêm vào BST</label>
              <select
                id="collection"
                value={newProduct.collectionId}
                onChange={(e) => setNewProduct({ ...newProduct, collectionId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Không chọn --</option>
                {collections.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
        </div>

        {newProduct.category === "feedback" && (
          <div>
            <label htmlFor="productLink" className="block text-sm font-medium text-gray-700">Link sản phẩm</label>
            <div className="mt-1 flex items-center">
              <LinkIcon className="h-5 w-5 text-blue-500 mr-2" />
              <input
                type="url"
                id="productLink"
                value={newProduct.productLink}
                onChange={(e) => setNewProduct({ ...newProduct, productLink: e.target.value })}
                placeholder="https://example.com/san-pham"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        )}

        {/* Checkbox Sale */}
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md border border-gray-200">
            <input
              type="checkbox"
              id="isSale"
              checked={newProduct.isSale}
              onChange={(e) => setNewProduct({...newProduct, isSale: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isSale" className="flex items-center text-sm font-medium text-gray-700 select-none cursor-pointer">
              <Tag className="w-4 h-4 mr-1 text-red-500" />
              Đang giảm giá (Sale)
            </label>
        </div>

        {/* Input Sale Percentage */}
        {newProduct.isSale && (
           <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="ml-7"
           >
              <label htmlFor="salePercentage" className="block text-sm font-medium text-gray-700">Phần trăm giảm (%)</label>
              <input
                type="number"
                id="salePercentage"
                value={newProduct.salePercentage}
                onChange={(e) => setNewProduct({ ...newProduct, salePercentage: e.target.value })}
                min="1"
                max="99"
                placeholder="VD: 20"
                className="mt-1 block w-1/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required={newProduct.isSale}
              />
           </motion.div>
        )}

        <div className="mt-1 flex items-center">
          <input
            type="file"
            id="image"
            className="sr-only"
            accept="image/*"
            onChange={handleImageChange}
          />
          <label
            htmlFor="image"
            className="cursor-pointer bg-blue-600 text-white py-2 px-3 rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-5 w-5 inline-block mr-2" />
            Tải ảnh chính
          </label>
          {newProduct.image && (
            <span className="ml-3 text-sm text-gray-500">Đã chọn ảnh</span>
          )}
        </div>

        <div className="mt-3">
          <input
            type="file"
            id="thumbnails"
            className="sr-only"
            accept="image/*"
            multiple
            onChange={handleThumbnailsChange}
          />
          <label
            htmlFor="thumbnails"
            className="cursor-pointer bg-blue-600 text-white py-2 px-3 rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Images className="h-5 w-5 inline-block mr-2" />
            Tải ảnh phụ
          </label>

          <div className="flex gap-2 mt-2 flex-wrap">
            {newProduct.thumbnails.map((thumb, i) => (
              <img
                key={i}
                src={thumb}
                alt={`thumb-${i}`}
                className="h-16 w-16 object-cover rounded border border-gray-300"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium 
          text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-blue-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Đang xử lý...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5" />
              Thêm sản phẩm
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateProductForm;