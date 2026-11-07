import { useEffect, useState } from "react";
import { useBannerStore } from "../stores/useBannerStore";
import { Image as ImageIcon, Video, Loader, UploadCloud } from "lucide-react";

const MAX_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO = 30 * 1024 * 1024; // 30MB
const MAX_VIDEO_SECONDS = 20;

const getVideoDuration = (file) =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Number(video.duration) || 0);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });

const BannerUploadForm = () => {
  const { uploadBanner, loading, bannerUrl, bannerType } = useBannerStore();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [previewType, setPreviewType] = useState("image");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError("");
    const isVideo = selected.type.startsWith("video/");

    if (!isVideo && !selected.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh hoặc video.");
      return;
    }
    if (isVideo && selected.size > MAX_VIDEO) {
      setError("Video tối đa 30MB. Vui lòng nén bớt trước khi tải.");
      return;
    }
    if (!isVideo && selected.size > MAX_IMAGE) {
      setError("Ảnh tối đa 10MB.");
      return;
    }

    if (isVideo) {
      const duration = await getVideoDuration(selected);
      if (duration > MAX_VIDEO_SECONDS) {
        setError(
          `Video dài ${Math.round(duration)} giây — tối đa ${MAX_VIDEO_SECONDS} giây.`
        );
        return;
      }
    }

    setFile(selected);
    setPreviewType(isVideo ? "video" : "image");
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) return;
    const ok = await uploadBanner(file);
    if (ok) {
      setFile(null);
      setPreview("");
      setPreviewType("image");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tải banner (ảnh hoặc video)</h2>

      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleChange}
        disabled={loading}
        className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
      />

      <p className="text-xs text-gray-500">
        Ảnh: JPG/PNG/WebP ≤ 10MB · Video: MP4 ≤ 30MB, dài ≤ 20 giây. Khuyến nghị 1920×1080,
        video ≤ 10 giây để trang tải nhanh.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}

      {preview && (
        <div className="w-full max-h-64 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {previewType === "video" ? (
            <video
              src={preview}
              className="w-full max-h-64 object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img src={preview} alt="Xem trước" className="w-full max-h-64 object-cover" />
          )}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader className="mr-2 h-5 w-5 animate-spin" />
            Đang tải lên...
          </>
        ) : (
          <>
            <UploadCloud className="mr-2 h-5 w-5" />
            Cập nhật banner
          </>
        )}
      </button>

      {bannerUrl && !preview && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            {bannerType === "video" ? (
              <Video className="mr-2 h-4 w-4" />
            ) : (
              <ImageIcon className="mr-2 h-4 w-4" />
            )}
            Banner hiện tại ({bannerType === "video" ? "video" : "ảnh"})
          </p>
          {bannerType === "video" ? (
            <video
              src={bannerUrl}
              className="w-full max-h-40 object-cover rounded border border-gray-200"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={bannerUrl}
              alt="Banner hiện tại"
              className="w-full max-h-40 object-cover rounded border border-gray-200"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BannerUploadForm;
