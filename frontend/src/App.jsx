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
import SearchPage from "./pages/SearchPage";

import { useCollectionStore } from "./stores/useCollectionStore";
import { useProductStore } from "./stores/useProductStore";
import ChatPopup from "./components/ChatPopup";

import ProductionPage from "./pages/ProductionPage";
import ProductionDetailPage from "./pages/ProductionDetailPage";
import AutoTranslator from "./components/AutoTranslator";

function App() {
  const { user, checkAuth, checkingAuth } = useUserStore();
  const { getCartItems } = useCartStore();
  
  const { fetchCollections } = useCollectionStore();
  
  const fetchFeaturedProducts = useProductStore((state) => state.fetchFeaturedProducts);

  const [isForceLoadingDone, setIsForceLoadingDone] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    fetchCollections();
    fetchFeaturedProducts();
  }, [fetchCollections, fetchFeaturedProducts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsForceLoadingDone(true);
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/vi\/([^;]+)/);
    if (match && match[1]) {
      document.body.setAttribute('data-lang', match[1]);
    } else {
      document.body.removeAttribute('data-lang');
    }
  }, []);
  useEffect(() => {
    if (!user) return;
    getCartItems();
  }, [getCartItems, user]);

  if (checkingAuth && !isForceLoadingDone) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col relative">
      <AutoTranslator />
      <Navbar />
      <ScrollToTop/>
      <ChatPopup />

      <div className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
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
          <Route
            path="/admin/production"
            element={
              (user?.role === "admin" || user?.role === "controller") ? <ProductionPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/admin/production/:id"
            element={
              (user?.role === "admin" || user?.role === "controller") ? <ProductionDetailPage /> : <Navigate to="/login" />
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