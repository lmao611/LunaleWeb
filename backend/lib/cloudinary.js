import {v2 as cloudinary} from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// ✅ HÀM MỚI: Tối ưu ảnh (Resize, Nén, Đổi định dạng)
export const optimizeUrl = (url, width = 800) => {
    if (!url) return "";
    // Nếu không phải ảnh Cloudinary thì trả về nguyên gốc
    if (!url.includes("cloudinary.com")) return url;
    
    // Nếu url đã có tham số chỉnh sửa rồi thì thôi để tránh lỗi
    if (url.includes("/q_auto") || url.includes("/w_")) return url;
  
    // Chèn tham số tối ưu vào sau chữ "/upload/"
    // w_${width}: Giới hạn chiều ngang
    // q_auto: Tự động cân bằng chất lượng/dung lượng
    // f_auto: Tự động chọn đuôi ảnh (WebP/AVIF)
    return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
};
  
// ✅ HÀM MỚI: Tối ưu Video
export const optimizeVideoUrl = (url, width = 800) => {
      if (!url) return "";
      if (!url.includes("cloudinary.com")) return url;
      
      // Với video: q_auto, f_auto, và vc_auto (video codec tối ưu)
      return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto,vc_auto/`);
};

export default cloudinary;