import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Loader, Star } from "lucide-react";
import { useCollectionStore } from "../stores/useCollectionStore";

const CreateCollectionForm = () => {
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
    media: "",
    gradientFrom: "#3b82f6", 
    gradientTo: "#06b6d4",
    isSpecial: false,   
  });
  const [loading, setLoading] = useState(false);
  const { createCollection } = useCollectionStore();

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewCollection({ ...newCollection, media: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await createCollection({
      name: newCollection.name,
      description: newCollection.description,
      coverMedia: {
        url: newCollection.media,
        type: newCollection.media.startsWith("data:video") ? "video" : "image",
      },
      gradientFrom: newCollection.gradientFrom,
      gradientTo: newCollection.gradientTo,
      isSpecial: newCollection.isSpecial,
    });
    setNewCollection({
      name: "",
      description: "",
      media: "",
      gradientFrom: "#3b82f6",
      gradientTo: "#06b6d4",
      isSpecial: false,
    });
    setLoading(false);
  };

  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-md rounded-lg p-8 mb-8 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-blue-700">
        Tạo bộ sưu tầm mới
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tên bộ sưu tầm
          </label>
          <input
            type="text"
            value={newCollection.name}
            onChange={(e) =>
              setNewCollection({ ...newCollection, name: e.target.value })
            }
            className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mô tả
          </label>
          <textarea
            rows="3"
            value={newCollection.description}
            onChange={(e) =>
              setNewCollection({ ...newCollection, description: e.target.value })
            }
            className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex items-center gap-3 p-3 border border-yellow-200 bg-yellow-50 rounded-md cursor-pointer" 
             onClick={() => setNewCollection({...newCollection, isSpecial: !newCollection.isSpecial})}>
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newCollection.isSpecial ? "bg-yellow-500 border-yellow-500" : "bg-white border-gray-300"}`}>
             {newCollection.isSpecial && <Star size={12} className="text-white fill-current" />}
          </div>
          <div>
            <span className="block text-sm font-bold text-gray-800">Special Collection</span>
            <span className="block text-xs text-gray-500">Hiển thị nổi bật, căn giữa ngay dưới Banner</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gradient tên bộ sưu tầm
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={newCollection.gradientFrom}
              onChange={(e) =>
                setNewCollection({
                  ...newCollection,
                  gradientFrom: e.target.value,
                })
              }
              className="w-12 h-10 rounded cursor-pointer border"
            />
            <input
              type="color"
              value={newCollection.gradientTo}
              onChange={(e) =>
                setNewCollection({
                  ...newCollection,
                  gradientTo: e.target.value,
                })
              }
              className="w-12 h-10 rounded cursor-pointer border"
            />
          </div>
          <div
            className="mt-2 text-2xl font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${newCollection.gradientFrom}, ${newCollection.gradientTo})`,
            }}
          >
            {newCollection.name || "Xem thử gradient"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ảnh hoặc video
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="mt-2"
          />
          {newCollection.media && (
            <div className="mt-3">
              {newCollection.media.startsWith("data:video") ? (
                <video
                  src={newCollection.media}
                  controls
                  className="w-full rounded-lg"
                />
              ) : (
                <img
                  src={newCollection.media}
                  alt="preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium 
          text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" /> Đang tạo...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5" /> Tạo bộ sưu tầm
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateCollectionForm;