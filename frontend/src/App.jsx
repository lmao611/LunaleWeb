import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useUserStore } from "./stores/useUserStore";
import { useCollectionStore } from "./stores/useCollectionStore";
import { useEffect } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import ProductPage from "./pages/ProductPage";
import { useCartStore } from "./stores/useCartStore";
import CollectionDetailPage from "./pages/CollectionDetailPage";
import PolicyPage from "./pages/PolicyPage";
import ScrollToTop from "./components/ScrollToTop";
import PrivacyPage from "./pages/PrivacyPage.jsx";

function App() {
  const { user, checkAuth } = useUserStore(); // ⚠️ Đã bỏ checkingAuth ở đây
  const { getCartItems } = useCartStore();
  const { fetchCollections, isLoading: isCollectionLoading } = useCollectionStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (!user) return;
    getCartItems();
  }, [getCartItems, user]);

  // ✅ SỬA LẠI: Chỉ hiển thị Loading Spinner khi đang tải Collections
  // Việc kiểm tra Auth (checkAuth) sẽ chạy ngầm (background).
  // Nếu mạng lag hoặc lỗi 401, trang web vẫn hiện ra cho khách xem bình thường.
  if (isCollectionLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Navbar />
      <ScrollToTop/>
      <div className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/signup"
            element={!user ? <SignUpPage /> : <Navigate to="/" />}
          />
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/secret-dashboard"
            element={
              // Logic bảo vệ route này vẫn an toàn, vì nếu user chưa load xong thì user là null -> chuyển về login
              (user?.role === "admin" || user?.role === "controller") ? <AdminPage /> : <Navigate to="/login" />
            }
          />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route
            path="/cart"
            element={user ? <CartPage /> : <Navigate to="/login" />}
          />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/collection/:id" element={<CollectionDetailPage />} />
          <Route path="/policy" element={<PolicyPage/>} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </div>
      <Footer />
      <Toaster />
    </div>
  );
}

export default App;