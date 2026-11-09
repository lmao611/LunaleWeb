export const optimizeUrl = (url, width = 800) => {
    if (!url) return "";
    
    if (url.startsWith("blob:") || !url.includes("cloudinary.com")) return url;

    if (url.match(/\/w_\d+/)) return url;

    return url.replace(/\/upload\//i, `/upload/w_${width},c_limit,q_auto,f_auto/`);
};
  
export const optimizeVideoUrl = (url) => {
    if (!url) return "";
    
    if (!url.includes("cloudinary.com")) return url;
    
    if (url.match(/\/vc_auto/)) return url;

    return url.replace(/\/upload\//i, `/upload/w_1080,c_limit,q_auto,f_auto,vc_auto,ac_none/`);
};

/**
 * Video banner hero: giữ đúng độ phân giải gốc (1920) và nén ở mức
 * chất lượng cao nhất Cloudinary có (q_auto:best).
 * Đo thực tế: 1920x1080 -> ~6.5MB, nhìn không phân biệt được với bản gốc.
 */
export const optimizeBannerVideo = (url, width = 1920) => {
    if (!url) return "";

    if (!url.includes("cloudinary.com")) return url;

    if (url.match(/\/w_\d+/)) return url;

    return url.replace(/\/upload\//i, `/upload/w_${width},c_limit,q_auto:best,vc_h264,ac_none/`);
};