import { useEffect, useState } from "react";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import FeaturedProducts from "../components/FeaturedProducts";
import CollectionsSection from "../components/CollectionsSection";
import axios from "axios";

const categories = [
  { href: "/dress", name: "Đầm nữ", imageUrl: "/dress.jpg" },
  
  { href: "/shirt", name: "Áo nữ", imageUrl: "/shirt.jpg" },
  { href: "/set", name: "Set", imageUrl: "/set.jpg" },
  { href: "/feedback", name: "Feedback", imageUrl: "/feedback.jpg" },
];

const HomePage = () => {
  const { fetchFeaturedProducts, products, isLoading } = useProductStore();
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    fetchFeaturedProducts();

    const fetchBanner = async () => {
      try {
        const res = await axios.get("/api/banner");
        setBannerUrl(res.data.imageUrl);
      } catch (err) {
        console.error("❌ Failed to load banner:", err.message);
      }
    };

    fetchBanner();
  }, [fetchFeaturedProducts]);

  return (
    <div className="bg-white text-gray-800 overflow-x-hidden">
      {/* ✅ Banner full màn hình */}
      {bannerUrl && (
        <section className="relative w-screen h-screen overflow-hidden">
          <img
            src={bannerUrl}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/10"></div>

          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center pt-130">
            
            <p className="text-white text-xl sm:text-2xl mb-10">
              Khám phá bộ sưu tập mới
            </p>
            <button
              onClick={() => {
                const nextSection = document.getElementById("homepage-content");
                nextSection?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-gray-300 transition"
            >
              Khám phá ngay
            </button>
          </div>
        </section>
      )}

      {/* ✅ Phần nội dung dưới banner */}
      <main
        id="homepage-content"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <h1 className="text-center sm:text-3xl font-bold text-blue-990 mb-8">
          SHOP NOW
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {categories.map((category) => (
            <CategoryItem category={category} key={category.name} />
          ))}
        </div>

        {!isLoading && Array.isArray(products) && products.length > 0 && (
          <FeaturedProducts featuredProducts={products} />
        )}

        <CollectionsSection />
      </main>
    </div>
  );
};

export default HomePage;
