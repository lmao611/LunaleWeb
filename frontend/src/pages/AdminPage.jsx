import {
  PlusCircle,
  ShoppingBasket,
  Images,
  UploadCloud,
  FileText,
  ClipboardList,
  Bell,
  MessageSquare, // Icon tin nhắn
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import CreateCollectionForm from "../components/CreateCollectionForm";
import CollectionsList from "../components/CollectionsList";
import BannerUploadForm from "../components/BannerUploadForm";
import OrdersManager from "../components/OrdersManager";
import CustomerOrders from "../components/CustomerOrders";
import OrderReceipt from "../components/OrderReceipt";
import SendNotificationForm from "../components/SendNotificationForm";
import AdminChatManager from "../components/AdminChatManager"; // Component quản lý chat

import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const tabs = [
  { id: "create", label: "Thêm sản phẩm", icon: PlusCircle },
  { id: "products", label: "Danh sách sản phẩm", icon: ShoppingBasket },
  { id: "collections", label: "Tạo bộ sưu tầm", icon: Images },
  { id: "collectionsList", label: "Danh sách bộ sưu tầm", icon: Images },
  { id: "banner", label: "Tải ảnh banner", icon: UploadCloud },
  { id: "orders", label: "Q.Lý Vận Chuyển", icon: FileText },
  { id: "customer_orders", label: "Đơn Khách Đặt", icon: ClipboardList },
  { id: "notifications", label: "Gửi Thông Báo", icon: Bell },
  { id: "messages", label: "Tin nhắn khách", icon: MessageSquare }, // Tab mới
  { id: "receipt", label: "Phiếu đặt hàng", icon: FileText },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const { fetchAllProducts } = useProductStore();
  const { user } = useUserStore();

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const handleCreateCollectionSuccess = () => {
    setActiveTab("collectionsList");
  };

  const visibleTabs = tabs.filter((tab) => {
    if (user?.role === "controller") return true;
    if (user?.role === "admin") {
      // Thêm "messages" vào danh sách cho phép của admin
      return ["create", "collections", "banner", "orders", "customer_orders", "notifications", "messages", "receipt"].includes(tab.id);
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24 pb-12">
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.h1
          className="text-4xl font-extrabold mb-6 text-blue-700 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Trang Quản Lý ({user?.role === "controller" ? "Controller" : "Admin"})
        </motion.h1>

        <div className="flex justify-center mb-8 flex-wrap gap-3">
          {visibleTabs.map((tab) => (
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
            <motion.div key="create" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <CreateProductForm />
            </motion.div>
          )}

          {activeTab === "products" && user?.role === "controller" && (
            <motion.div key="products" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <ProductsList />
            </motion.div>
          )}

          {activeTab === "collections" && (
            <motion.div key="collections" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <CreateCollectionForm onCreate={handleCreateCollectionSuccess} />
            </motion.div>
          )}

          {activeTab === "collectionsList" && user?.role === "controller" && (
            <motion.div key="collectionsList" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <CollectionsList />
            </motion.div>
          )}

          {activeTab === "banner" && (
            <motion.div key="banner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <BannerUploadForm />
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <OrdersManager />
            </motion.div>
          )}

          {activeTab === "customer_orders" && (
            <motion.div key="customer_orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <CustomerOrders />
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <SendNotificationForm />
            </motion.div>
          )}

          {activeTab === "messages" && (
            <motion.div key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <AdminChatManager />
            </motion.div>
          )}

          {activeTab === "receipt" && (
            <motion.div key="receipt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <OrderReceipt />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPage;