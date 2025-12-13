// frontend/src/lib/cloudinary.js

export const optimizeUrl = (url, width = 400) => {
    if (!url) return "";
    // Bỏ qua ảnh Blob hoặc ảnh không phải của Cloudinary
    if (url.startsWith("blob:") || !url.includes("cloudinary.com")) return url;

    // Nếu link đã có tham số tối ưu (w_..., q_...) thì không chèn thêm
    if (url.match(/\/w_\d+/)) return url;

    // ✅ Regex tìm vị trí "/upload/" bất kể viết hoa/thường
    // Chèn: w_{width}, q_auto (chất lượng), f_auto (định dạng nhẹ nhất)
    return url.replace(/\/upload\//i, `/upload/w_${width},q_auto,f_auto/`);
};
  
export const optimizeVideoUrl = (url, width = 600) => {
    if (!url) return "";
    if (!url.includes("cloudinary.com")) return url;
    if (url.match(/\/vc_auto/)) return url;

    // Video: Resize + Nén + TẮT TIẾNG (ac_none) + Giới hạn Bitrate (br_2m)
    return url.replace(/\/upload\//i, `/upload/w_${width},q_auto,f_auto,vc_auto,ac_none,br_2m/`);
};