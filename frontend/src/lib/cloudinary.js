export const optimizeUrl = (url, width = 800) => {
    if (!url) return "";
    
    if (url.startsWith("blob:") || !url.includes("cloudinary.com")) return url;

    if (url.match(/\/w_\d+/)) return url;

    return url.replace(/\/upload\//i, `/upload/w_${width},q_auto:best,f_auto/`);
};
  
export const optimizeVideoUrl = (url) => {
    if (!url) return "";
    
    if (!url.includes("cloudinary.com")) return url;
    
    if (url.match(/\/vc_auto/)) return url;

    return url.replace(/\/upload\//i, `/upload/q_auto:best,f_auto,vc_auto,ac_none/`);
};