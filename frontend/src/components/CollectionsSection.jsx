import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { optimizeUrl } from "../lib/cloudinary";
import SmartVideo from "./SmartVideo"; // ✅ Import component mới

const CollectionsSection = ({ collections }) => {
  if (!Array.isArray(collections) || !collections.length) return null;

  return (
    <section className="mt-24 space-y-28">
      <h2 className="text-[26px] font-bold text-center text-black mb-8">Bộ Sưu Tập</h2>

      {collections.map((col, index) => (
        <motion.div
          key={col._id}
          className={`flex flex-col md:flex-row items-center gap-12 ${
            index % 2 === 0 ? "md:flex-row-reverse" : ""
          }`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }} // Load trễ hơn chút
          transition={{ duration: 0.7 }}
        >
          {/* Text Content */}
          <div className="flex-1 text-center px-4">
            <motion.h3 whileHover={{ scale: 1.05 }} className="inline-block max-w-[600px] break-words"
              style={{ backgroundImage: `linear-gradient(to right, ${col.gradientFrom || "#3b82f6"}, ${col.gradientTo || "#06b6d4"})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Link to={`/collection/${col._id}`} className="text-5xl font-extrabold tracking-tight leading-tight">
                {col.name}
              </Link>
            </motion.h3>
            <hr className="w-24 mx-auto border-t-4 border-blue-600 my-6 rounded-full opacity-80" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed mt-3 break-words">{col.description}</p>
          </div>

          {/* Media Card - Dùng SmartVideo */}
          <div className="flex-1 flex justify-center">
            <Link to={`/collection/${col._id}`}>
              <motion.div whileHover={{ scale: 1.02 }} className="rounded-3xl overflow-hidden shadow-2xl w-[330px] h-[450px] sm:w-[320px] sm:h-[480px] md:w-[400px] md:h-[600px] relative flex items-center justify-center bg-gray-200">
                <div className="absolute inset-0 w-full h-full">
                  {col.coverMedia?.type === "video" ? (
                    // ✅ DÙNG SMART VIDEO
                    <SmartVideo src={col.coverMedia.url} className="w-full h-full" width={600} />
                  ) : (
                    <img src={optimizeUrl(col.coverMedia?.url, 600)} alt={col.name} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      ))}
    </section>
  );
};
export default CollectionsSection;