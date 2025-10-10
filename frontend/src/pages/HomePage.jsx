import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import FeaturedProducts from "../components/FeaturedProducts";
import CollectionsSection from "../components/CollectionsSection";
import { useEffect } from "react";

const categories = [
  { href: "/dress", name: "Đầm nữ", imageUrl: "/dress.jpg" },
  { href: "/skirt", name: "Chân váy", imageUrl: "/skirt.jpg" },
  { href: "/shirt", name: "Áo nữ", imageUrl: "/shirt.jpg" },
  { href: "/set", name: "Đồ bộ", imageUrl: "/set.jpg" },
];

const HomePage = () => {
  const { fetchFeaturedProducts, products, isLoading } = useProductStore();

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return (
    <div className="relative min-h-screen bg-white text-gray-800 overflow-hidden pt-20">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-30">
        <h1 className="text-center text-5xl sm:text-6xl font-bold text-blue-800 mb-8">
          CÁC DÒNG SẢN PHẨM CỦA CHÚNG TÔI
        </h1>

        {/* Danh mục sản phẩm */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {categories.map((category) => (
            <CategoryItem category={category} key={category.name} />
          ))}
        </div>

        {/* Sản phẩm nổi bật */}
        {!isLoading && Array.isArray(products) && products.length > 0 && (
          <FeaturedProducts featuredProducts={products} />
        )}

        {/* Bộ sưu tầm */}
        <CollectionsSection />
      </div>
    </div>
  );
};

export default HomePage;
