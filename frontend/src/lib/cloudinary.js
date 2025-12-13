// File: frontend/src/lib/cloudinary.js

// ✅ HÀM MỚI: Tối ưu ảnh (Resize, Nén, Đổi định dạng)
// Chỉ xử lý chuỗi string, không cần gọi API
export const optimizeUrl = (url, width = 800) => {
    if (!url) return "";
    // Nếu không phải ảnh Cloudinary thì trả về nguyên gốc
    if (!url.includes("cloudinary.com")) return url;
    
    // Nếu url đã có tham số chỉnh sửa rồi thì thôi để tránh lỗi
    if (url.includes("/q_auto") || url.includes("/w_")) return url;
  
    // Chèn tham số tối ưu vào sau chữ "/upload/"
    // w_: width (chiều rộng)
    // q_auto: chất lượng tự động (giảm dung lượng mà mắt thường không thấy)
    // f_auto: định dạng tự động (ví dụ chrome dùng webp/avif)
    return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
};
  
// ✅ HÀM MỚI: Tối ưu Video
export const optimizeVideoUrl = (url, width = 800) => {
      if (!url) return "";
      if (!url.includes("cloudinary.com")) return url;
      
      // vc_auto: codec video tự động tối ưu cho trình duyệt
      return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto,vc_auto/`);
};