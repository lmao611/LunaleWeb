export const optimizeUrl = (url, width = 800) => {
    if (!url) return "";
    
    if (url.startsWith("blob:") || !url.includes("cloudinary.com")) return url;

    if (url.match(/\/w_\d+/)) return url;

    return url.replace(/\/upload\//i, `/upload/w_${width},q_auto,f_auto/`);
};
  
export const optimizeVideoUrl = (url) => {
    if (!url) return "";
    
    if (!url.includes("cloudinary.com")) return url;
    
    if (url.match(/\/vc_auto/)) return url;

    return url.replace(/\/upload\//i, `/upload/w_1080,c_limit,q_auto,f_auto,vc_auto,ac_none/`);
};

/**
 * Video banner hero: 1600px, nén tự động, bỏ âm thanh (vì luôn muted).
 * Tránh tải video nặng 15–25MB xuống máy khách.
 */
export const optimizeBannerVideo = (url, width = 1600) => {
    if (!url) return "";

    if (!url.includes("cloudinary.com")) return url;

    if (url.match(/\/w_\d+/)) return url;

    return url.replace(/\/upload\//i, `/upload/w_${width},c_limit,q_auto,vc_auto,ac_none/`);
};