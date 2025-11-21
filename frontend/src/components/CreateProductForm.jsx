import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader, Images, Link as LinkIcon } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const categories = [
  { id: "dress", label: "Đầm nữ" },
  { id: "shirt", label: "Áo nữ" },
  { id: "set", label: "Đồ bộ" },
  { id: "feedback", label: "Feedback" },
];

const CreateProductForm = () => {
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    thumbnails: [],
    productLink: "",
  });

  const { createProduct, loading } = useProductStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct(newProduct);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        image: "",
        thumbnails: [],
        productLink: "",
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
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Tên sản phẩm
          </label>
          <input
            type="text"
            id="name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
             text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Mô tả */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Mô tả
          </label>
          <textarea
            id="description"
            value={newProduct.description}
            onChange={(e) =>
              setNewProduct({ ...newProduct, description: e.target.value })
            }
            rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm 
             py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Giá */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Giá (USD)
          </label>
          <input
            type="number"
            id="price"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm 
            py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Loại sản phẩm */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Loại sản phẩm
          </label>
          <select
            id="category"
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category: e.target.value })
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm 
             py-2 px-3 text-gray-900 focus:outline-none 
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">-- Chọn loại sản phẩm --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {newProduct.category === "feedback" && (
          <div>
            <label
              htmlFor="productLink"
              className="block text-sm font-medium text-gray-700"
            >
              Link sản phẩm
            </label>
            <div className="mt-1 flex items-center">
              <LinkIcon className="h-5 w-5 text-blue-500 mr-2" />
              <input
                type="url"
                id="productLink"
                value={newProduct.productLink}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, productLink: e.target.value })
                }
                placeholder="https://example.com/san-pham"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 
                 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
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