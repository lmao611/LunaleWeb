import axios from "./axios";

/**
 * Upload TRỰC TIẾP từ trình duyệt lên Cloudinary bằng chữ ký do server cấp.
 *
 * Ưu điểm so với gửi base64 qua API:
 *  - Không vướng giới hạn body 15MB
 *  - Giữ nguyên chất lượng gốc (không nén lại)
 *  - Không lộ API secret ra trình duyệt (dùng signature)
 */

// Chỉ hạ kích thước ảnh khi file quá lớn (Cloudinary free giới hạn 10MB/file)
const DOWNSIZE_THRESHOLD = 8 * 1024 * 1024;
const MAX_EDGE = 2400;

const downscale = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          resolve(blob || file);
        },
        "image/jpeg",
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });

const uploadToCloudinary = async (file, { folder, resourceType }) => {
  const { data } = await axios.get(
    `/admin/upload-signature?folder=${encodeURIComponent(folder)}&type=${resourceType}`
  );

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", data.apiKey);
  form.append("timestamp", data.timestamp);
  form.append("signature", data.signature);
  form.append("folder", data.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/${resourceType}/upload`,
    { method: "POST", body: form }
  );

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.secure_url) {
    throw new Error(json?.error?.message || "Upload thất bại");
  }

  return json.secure_url;
};

/** Ảnh sản phẩm / thumbnail (tự hạ kích thước nếu > 8MB) */
export const uploadImageToCloudinary = async (file, folder = "products") => {
  if (!file) throw new Error("Không có file");
  const payload = file.size > DOWNSIZE_THRESHOLD ? await downscale(file) : file;
  return uploadToCloudinary(payload, { folder, resourceType: "image" });
};

/** Video (banner) — giữ nguyên file gốc */
export const uploadVideoToCloudinary = async (file, folder = "banners") => {
  if (!file) throw new Error("Không có file");
  return uploadToCloudinary(file, { folder, resourceType: "video" });
};

/**
 * Tạo URL poster (frame đầu) từ URL video Cloudinary.
 * res.cloudinary.com/<cloud>/video/upload/v123/banners/a.mp4
 *   -> .../video/upload/so_0,w_1600,q_auto,f_auto/v123/banners/a.jpg
 */
export const buildVideoPoster = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes("/video/upload/")) return "";
  return videoUrl
    .replace("/video/upload/", "/video/upload/so_0,w_1600,q_auto,f_auto/")
    .replace(/\.(mp4|mov|webm|m4v|avi|mkv)$/i, ".jpg");
};

/** Upload ảnh hoặc video cho banner, tự nhận loại theo MIME */
export const uploadBannerMedia = async (file) => {
  const isVideo = typeof file?.type === "string" && file.type.startsWith("video/");
  const url = isVideo
    ? await uploadVideoToCloudinary(file, "banners")
    : await uploadImageToCloudinary(file, "banners");

  return {
    mediaUrl: url,
    mediaType: isVideo ? "video" : "image",
    posterUrl: isVideo ? buildVideoPoster(url) : "",
  };
};
