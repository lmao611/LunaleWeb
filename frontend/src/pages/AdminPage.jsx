import { PlusCircle, ShoppingBasket, Images, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import CreateCollectionForm from "../components/CreateCollectionForm";
import CollectionsList from "../components/CollectionsList";
import BannerUploadForm from "../components/BannerUploadForm";
import { useProductStore } from "../stores/useProductStore";

const tabs = [
  { id: "create", label: "Thêm sản phẩm", icon: PlusCircle },
  { id: "products", label: "Danh sách sản phẩm", icon: ShoppingBasket },
  { id: "collections", label: "Tạo bộ sưu tầm", icon: Images },
  { id: "collectionsList", label: "Danh sách bộ sưu tầm", icon: Images },
  { id: "banner", label: "Tải ảnh banner", icon: UploadCloud },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const { fetchAllProducts } = useProductStore();

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const handleCreateCollection = (col) => {
    const stored = JSON.parse(localStorage.getItem("collections") || "[]");
    localStorage.setItem(
      "collections",
      JSON.stringify([...stored, { ...col, products: col.products || [] }])
    );
    alert("✅ Bộ sưu tầm đã được lưu!");
    setActiveTab("collectionsList");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24 pb-12">
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.h1
          className="text-4xl font-extrabold mb-6 text-blue-700 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Trang Admin
        </motion.h1>

        <div className="flex justify-center mb-8 flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium border transition-all duration-200
                ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                    : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                }`}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <CreateProductForm />
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <ProductsList />
            </motion.div>
          )}

          {activeTab === "collections" && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <CreateCollectionForm onCreate={handleCreateCollection} />
            </motion.div>
          )}

          {activeTab === "collectionsList" && (
            <motion.div
              key="collectionsList"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <CollectionsList />
            </motion.div>
          )}

          {activeTab === "banner" && (
            <motion.div
              key="banner"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <BannerUploadForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPage;