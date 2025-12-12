import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useUserStore } from "./stores/useUserStore";
import { useEffect, useState } from "react";
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

// ✅ 1. Import thêm các Store cần load sớm
import { useCollectionStore } from "./stores/useCollectionStore";
import { useProductStore } from "./stores/useProductStore";

function App() {
  const { user, checkAuth, checkingAuth } = useUserStore();
  const { getCartItems } = useCartStore();
  
  // ✅ 2. Lấy hàm fetch ra đây
  const { fetchCollections } = useCollectionStore();
  const { fetchFeaturedProducts } = useProductStore();

  const [isForceLoadingDone, setIsForceLoadingDone] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ✅ 3. Gọi API ngay khi App vừa chạy (Chạy ngầm trong lúc đang đếm giây)
  useEffect(() => {
    fetchCollections();      // Tải Collection
    fetchFeaturedProducts(); // Tải sản phẩm nổi bật
  }, [fetchCollections, fetchFeaturedProducts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsForceLoadingDone(true);
    }, 3000); // Giữ loading trong 3 giây

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    getCartItems();
  }, [getCartItems, user]);

  // Điều kiện loading: Đợi check Auth xong VÀ đợi đủ 3 giây
  if (checkingAuth || !isForceLoadingDone) return <LoadingSpinner />;

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