import Visit from "../models/visit.model.js";
import { io } from "../lib/socket.js";

export const trackVisit = async (req, res) => {
    try {
        const { name, email } = req.body;
        const ip = req.realIp || req.ip || req.connection.remoteAddress;
        
        const today = new Date();
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(today);

        let visitDoc = await Visit.findOne({ date: dateStr });
        if (!visitDoc) {
            visitDoc = new Visit({ date: dateStr, visitors: [] });
        }

        const isExist = visitDoc.visitors.some(v => 
            (email && v.email === email) || v.ip === ip
        );

        if (!isExist) {
            visitDoc.visitors.push({
                ip,
                name: name || "Khách vãng lai",
                email: email || ""
            });
            await visitDoc.save();
            
            io.emit("dailyVisitorUpdate", visitDoc.visitors.length);
        }

        res.status(200).json({ count: visitDoc.visitors.length });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getDailyVisits = async (req, res) => {
    try {
        const today = new Date();
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(today);

        const visitDoc = await Visit.findOne({ date: dateStr });
        if (!visitDoc) {
            return res.status(200).json({ count: 0, visitors: [] });
        }

        const sortedVisitors = visitDoc.visitors.sort((a, b) => b.time - a.time);
        res.status(200).json({ count: visitDoc.visitors.length, visitors: sortedVisitors });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};