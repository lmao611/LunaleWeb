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
    createdAt: { type: Date, default: Date.now, expires: 259200 }
});

export default mongoose.model("Visit", visitSchema);