import axios from "./axios";

/**
 * Upload ảnh TRỰC TIẾP từ trình duyệt lên Cloudinary bằng chữ ký do server cấp.
 *
 * Ưu điểm so với gửi base64 qua API:
 *  - Không vướng giới hạn body 15MB
 *  - Giữ nguyên chất lượng gốc (không nén lại)
 *  - Không lộ API secret ra trình duyệt (dùng signature)
 */

// Chỉ hạ kích thước khi ảnh quá lớn (Cloudinary free giới hạn 10MB/file)
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

export const uploadImageToCloudinary = async (file, folder = "products") => {
  if (!file) throw new Error("Không có file");

  const payload = file.size > DOWNSIZE_THRESHOLD ? await downscale(file) : file;

  const { data } = await axios.get(
    `/admin/upload-signature?folder=${encodeURIComponent(folder)}`
  );

  const form = new FormData();
  form.append("file", payload);
  form.append("api_key", data.apiKey);
  form.append("timestamp", data.timestamp);
  form.append("signature", data.signature);
  form.append("folder", data.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.secure_url) {
    throw new Error(json?.error?.message || "Upload ảnh thất bại");
  }

  return json.secure_url;
};
