import { useState } from "react";
import axios from "../lib/axios";

const BannerUploadForm = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const handleChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append("banner", image);

    try {
      await axios.post("/banner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Banner uploaded!");
    } catch (err) {
      console.error(err.message);
      alert("Upload failed");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tải ảnh banner</h2>
      <input type="file" accept="image/*" onChange={handleChange} />
      {preview && <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />}
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload Banner
      </button>
    </div>
  );
};

export default BannerUploadForm;