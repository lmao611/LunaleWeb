import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
});

export default mongoose.model("Banner", bannerSchema);