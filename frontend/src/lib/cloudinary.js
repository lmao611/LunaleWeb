// frontend/src/lib/cloudinary.js

export const optimizeUrl = (url, width = 500) => {
    if (!url) return "";
    // Bỏ qua ảnh không phải cloudinary hoặc ảnh blob (upload tạm)
    if (!url.includes("cloudinary.com") || url.startsWith("blob:")) return url;

    // Nếu URL đã được tối ưu rồi thì trả về luôn
    if (url.includes("/q_auto") || url.includes("/w_")) return url;

    // Tách chuỗi tại chữ "/upload/"
    const parts = url.split("/upload/");
    
    // Nếu tách thành công thành 2 phần
    if (parts.length === 2) {
        // Chèn tham số: width, quality auto, format auto
        const newUrl = `${parts[0]}/upload/w_${width},q_auto,f_auto/${parts[1]}`;
        return newUrl;
    }

    return url;
};
  
export const optimizeVideoUrl = (url, width = 600) => {
      if (!url) return "";
      if (!url.includes("cloudinary.com")) return url;
      if (url.includes("/q_auto")) return url;
      
      const parts = url.split("/upload/");
      if (parts.length === 2) {
          // Video cần xử lý kỹ hơn:
          // w_${width}: Resize
          // q_auto: Chất lượng tự động
          // f_auto: Định dạng video tối ưu (webm/mp4)
          // vc_auto: Codec tự động
          // ac_none: Tắt tiếng (quan trọng để giảm tải nếu video chỉ để làm nền)
          // br_2m: Giới hạn bitrate tối đa 2Mbps (giúp load nhanh hơn nhiều)
          const newUrl = `${parts[0]}/upload/w_${width},q_auto,f_auto,vc_auto,ac_none,br_2m/${parts[1]}`;
          return newUrl;
      }
      return url;
};