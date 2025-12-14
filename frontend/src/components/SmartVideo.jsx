import { useState } from "react";
import { motion } from "framer-motion";
import { optimizeUrl, optimizeVideoUrl } from "../lib/cloudinary";

const SmartVideo = ({ src, poster, className, width = 600 }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Tạo ảnh poster từ link video (nếu không có poster riêng)
  const posterSrc = poster || (src ? src.replace(/\.[^/.]+$/, ".jpg") : "");

  return (
    <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
      {/* 1. Lớp Ảnh Bìa (Load ngay lập tức - Rất nhẹ) */}
      <img 
        src={optimizeUrl(posterSrc, width)} 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? "opacity-0" : "opacity-100"}`}
        alt="Video Preview"
        loading="lazy"
      />

      {/* 2. Lớp Video (Chỉ tải khi lướt tới gần - Viewport) */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }} // Lướt thấy 25% khung hình mới load video
        onViewportEnter={() => setIsPlaying(true)}
      >
        {isPlaying && (
          <video
            src={optimizeVideoUrl(src, width)} 
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}
      </motion.div>
    </div>
  );
};

export default SmartVideo;