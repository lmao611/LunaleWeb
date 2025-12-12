import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// ✅ CẬP NHẬT: Nhận collections từ props thay vì tự fetch
const CollectionsSection = ({ collections }) => {
  if (!Array.isArray(collections) || !collections.length) return null;

  return (
    <section className="mt-24 space-y-28">
      <h2 className="text-3xl font-bold text-center text-black mb-8">
        Bộ Sưu Tầm Khác
      </h2>

      {collections.map((col, index) => (
        <motion.div
          key={col._id}
          className={`flex flex-col md:flex-row items-center gap-12 ${
            index % 2 === 0 ? "md:flex-row-reverse" : ""
          }`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Text Content */}
          <div className="flex-1 text-center px-4">
            <motion.h3
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-block max-w-[600px] break-words"
              style={{
                backgroundImage: `linear-gradient(to right, ${
                  col.gradientFrom || "#3b82f6"
                }, ${col.gradientTo || "#06b6d4"})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <Link
                to={`/collection/${col._id}`}
                className="text-5xl font-extrabold tracking-tight leading-tight"
              >
                {col.name}
              </Link>
            </motion.h3>

            <hr className="w-24 mx-auto border-t-4 border-blue-600 my-6 rounded-full opacity-80" />

            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed mt-3 break-words">
              {col.description}
            </p>
          </div>

          {/* Media Card */}
          <div className="flex-1 flex justify-center">
            <Link to={`/collection/${col._id}`}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="
                  rounded-3xl overflow-hidden shadow-2xl 
                  w-[330px] h-[450px]          /* Mobile default */
                  sm:w-[320px] sm:h-[480px]    /* Small screens */
                  md:w-[400px] md:h-[600px]    /* Medium and up */
                  relative flex items-center justify-center bg-gray-200
                "
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="absolute inset-0 w-full h-full transform-gpu backface-hidden will-change-transform"
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
                </motion.div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      ))}
    </section>
  );
};

export default CollectionsSection;