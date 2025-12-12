import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; 
import { motion } from "framer-motion";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import { useCollectionStore } from "../stores/useCollectionStore";
import FeaturedProducts from "../components/FeaturedProducts";
import CollectionsSection from "../components/CollectionsSection";
import axios from "../lib/axios";

const categories = [
  { href: "/dress", name: "Đầm nữ", imageUrl: "/dress.jpg" },
  { href: "/shirt", name: "Áo nữ", imageUrl: "/shirt.jpg" },
  { href: "/set", name: "Set", imageUrl: "/set.jpg" },
  { href: "/feedback", name: "Feedback", imageUrl: "/feedback.jpg" },
];

const HomePage = () => {
  const { products, isLoading: loadingProducts } = useProductStore();
  const { collections } = useCollectionStore();
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await axios.get("/banner");
        setBannerUrl(res.data.imageUrl);
      } catch (err) { console.error(err.message); }
    };
    fetchBanner();
  }, []);

  const specialCollections = collections.filter(c => c.isSpecial === true);
  const regularCollections = collections.filter(c => !c.isSpecial);

  const renderSpecialCollectionsByPosition = (position) => {
    const targetCollections = specialCollections.filter(c => c.specialPosition === position);

    if (targetCollections.length === 0) return null;

    return (
      <div className="flex flex-col gap-20 my-20">
        {targetCollections.map((col) => {
           // ✅ Tạo style object chứa biến CSS
           const dynamicStyles = {
               "--mobile-w": `${col.mobileWidth || 100}%`,
               "--mobile-h": `${col.mobileHeight || 400}px`,
               "--desktop-w": `${col.desktopWidth || 100}%`,
               "--desktop-h": `${col.desktopHeight || 600}px`,
           };

           return (
             <motion.div 
               key={col._id}
               className="w-full flex flex-col items-center justify-center text-center px-0 md:px-4"
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8 }}
             >
                {/* Tên Collection */}
                {!col.hideName && (
                    <motion.h2 
                       className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight px-4"
                       style={{
                           backgroundImage: `linear-gradient(to right, ${col.gradientFrom}, ${col.gradientTo})`,
                           WebkitBackgroundClip: "text",
                           WebkitTextFillColor: "transparent",
                       }}
                    >
                      {col.name}
                    </motion.h2>
                )}
                
                {/* Mô tả */}
                {!col.hideDescription && (
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mb-10 leading-relaxed px-4">
                      {col.description}
                    </p>
                )}

                <Link to={`/collection/${col._id}`} className="block group flex justify-center w-full">
                   {/* ✅ KHUNG HÌNH CHÍNH
                      Sử dụng Tailwind arbitrary values [] kết hợp với biến CSS đã khai báo ở trên
                   */}
                   <motion.div
                       whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                       style={dynamicStyles}
                       className="
                         relative overflow-hidden shadow-2xl bg-gray-100
                         rounded-none md:rounded-3xl
                         
                         /* Mobile First (Mặc định) */
                         w-[var(--mobile-w)] 
                         h-[var(--mobile-h)]
                         
                         /* Desktop (Màn hình từ md trở lên) */
                         md:w-[var(--desktop-w)] 
                         md:h-[var(--desktop-h)]
                       "
                   >
                       {col.coverMedia?.type === "video" ? (
                           <video
                               src={col.coverMedia.url}
                               autoPlay
                               muted
                               loop
                               playsInline
                               className="w-full h-full object-cover"
                           />
                       ) : (
                           <img
                               src={col.coverMedia?.url}
                               alt={col.name}
                               className="w-full h-full object-cover"
                           />
                       )}
                       
                       {/* Overlay Gradient */}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                       
                       {/* Nút Xem Ngay */}
                       <div className="absolute bottom-8 left-0 right-0 text-white font-medium tracking-widest text-lg uppercase pointer-events-none text-center">
                           Xem Ngay
                       </div>
                   </motion.div>
                </Link>
             </motion.div>
           );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white text-gray-800 overflow-x-hidden">
      {bannerUrl && (
        <section className="relative w-screen h-screen overflow-hidden">
          <img src={bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center pt-130">
            <p className="text-white text-xl sm:text-2xl mb-10">Khám phá bộ sưu tập mới</p>
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

      <main id="homepage-content" className="relative z-10 max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-10">
        
        {renderSpecialCollectionsByPosition("below_banner")}

        <h1 className="text-center sm:text-3xl font-bold text-blue-990 mb-8 pt-10">SHOP NOW</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6 mb-16 px-4">
          {categories.map((category) => (
            <CategoryItem category={category} key={category.name} />
          ))}
        </div>

        {renderSpecialCollectionsByPosition("below_categories")}

        {!loadingProducts && Array.isArray(products) && products.length > 0 && (
          <FeaturedProducts featuredProducts={products} />
        )}
        
        {renderSpecialCollectionsByPosition("below_featured")}

        <CollectionsSection collections={regularCollections} />
      </main>
    </div>
  );
};

export default HomePage;