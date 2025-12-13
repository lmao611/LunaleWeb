// frontend/src/lib/cloudinary.js

export const optimizeUrl = (url, width = 400) => {
    // 1. Kiểm tra đầu vào
    if (!url) return "";
    // Nếu là ảnh blob (upload tạm) hoặc ảnh mạng khác -> Giữ nguyên
    if (url.startsWith("blob:") || !url.includes("cloudinary.com")) return url;

    // 2. Nếu đã tối ưu rồi (có w_ hoặc q_auto) -> Giữ nguyên để tránh lỗi
    if (url.includes("/w_") && url.includes("/q_auto")) return url;

    // 3. Dùng Regex để chèn tham số vào sau chữ "/upload/" bất kể nó nằm đâu
    // Tham số: w_{width}, q_auto (chất lượng), f_auto (định dạng avif/webp)
    const params = `w_${width},q_auto,f_auto`;
    
    // Thay thế "/upload/" bằng "/upload/params/"
    // Cờ "i" để không phân biệt hoa thường
    return url.replace(/\/upload\//i, `/upload/${params}/`);
};
  
export const optimizeVideoUrl = (url, width = 600) => {
    if (!url) return "";
    if (!url.includes("cloudinary.com")) return url;
    
    // Nếu đã tối ưu rồi thì thôi
    if (url.includes("/vc_auto")) return url;

    // Tham số video mạnh tay hơn:
    // w_{width}: Resize
    // q_auto: Chất lượng
    // f_auto: Định dạng
    // vc_auto: Codec thông minh
    // ac_none: TẮT TIẾNG (Rất quan trọng để giảm dung lượng)
    // br_2m: Giới hạn Bitrate dưới 2Mb/s
    const params = `w_${width},q_auto,f_auto,vc_auto,ac_none,br_2m`;

    return url.replace(/\/upload\//i, `/upload/${params}/`);
};