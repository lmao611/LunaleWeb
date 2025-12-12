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
  const { fetchFeaturedProducts, products, isLoading: loadingProducts } = useProductStore();
  const { fetchCollections, collections, isLoading: loadingCols } = useCollectionStore();
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCollections();

    const fetchBanner = async () => {
      try {
        const res = await axios.get("/banner");
        setBannerUrl(res.data.imageUrl);
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchBanner();
  }, [fetchFeaturedProducts, fetchCollections]);

  const specialCollection = collections.find(c => c.isSpecial === true);
  const regularCollections = collections.filter(c => !c.isSpecial);

  return (
    <div className="bg-white text-gray-800 overflow-x-hidden">
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

      <main
        id="homepage-content"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        
        {specialCollection && (
          <motion.div 
            className="w-full flex flex-col items-center justify-center text-center mb-20"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
             <motion.h2 
                className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight"
                style={{
                    backgroundImage: `linear-gradient(to right, ${specialCollection.gradientFrom}, ${specialCollection.gradientTo})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
             >
               {specialCollection.name}
             </motion.h2>
             
             <p className="text-gray-600 text-lg md:text-xl max-w-3xl mb-10 leading-relaxed">
               {specialCollection.description}
             </p>

             <Link to={`/collection/${specialCollection._id}`} className="block">
                <motion.div
                    whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                    className="rounded-3xl overflow-hidden shadow-2xl w-[90vw] max-w-[500px] aspect-[4/5] relative mx-auto"
                >
                    {specialCollection.coverMedia?.type === "video" ? (
                        <video
                        src={specialCollection.coverMedia.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                        src={specialCollection.coverMedia?.url}
                        alt={specialCollection.name}
                        className="w-full h-full object-cover"
                        />
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-6 left-0 right-0 text-white font-medium tracking-wider pointer-events-none">
                        XEM CHI TIẾT
                    </div>
                </motion.div>
             </Link>
          </motion.div>
        )}

        <h1 className="text-center sm:text-3xl font-bold text-blue-990 mb-8 border-t pt-10 border-gray-100">
          SHOP NOW
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {categories.map((category) => (
            <CategoryItem category={category} key={category.name} />
          ))}
        </div>

        {!loadingProducts && Array.isArray(products) && products.length > 0 && (
          <FeaturedProducts featuredProducts={products} />
        )}

        <CollectionsSection collections={regularCollections} />
      </main>
    </div>
  );
};

export default HomePage;