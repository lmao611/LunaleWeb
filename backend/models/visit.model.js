import mongoose from "mongoose";

const visitSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    visitors: [
        {
            ip: { type: String, required: true },
            name: { type: String, default: "Khách vãng lai" },
            email: { type: String, default: "" },
            time: { type: Date, default: Date.now }
        }
    ],
    // Tự động xóa document sau 3 ngày (3 * 24 * 60 * 60 = 259200 giây)
    createdAt: { type: Date, default: Date.now, expires: 259200 } 
});

export default mongoose.model("Visit", visitSchema);