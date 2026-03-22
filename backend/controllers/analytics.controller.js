import Visit from "../models/visit.model.js";
import { io } from "../lib/socket.js";

export const trackVisit = async (req, res) => {
    try {
        const { name, email } = req.body;
        // Lấy IP thật của khách hàng (kể cả khi qua proxy/Cloudflare)
        const ip = req.realIp || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
        
        const today = new Date();
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(today);

        let visitDoc = await Visit.findOne({ date: dateStr });
        if (!visitDoc) {
            visitDoc = new Visit({ date: dateStr, visitors: [] });
        }

        const existingVisitorIndex = visitDoc.visitors.findIndex(v => v.ip === ip);
        let isUpdated = false;

        if (existingVisitorIndex !== -1) {
            // IP này đã truy cập trong ngày
            const v = visitDoc.visitors[existingVisitorIndex];
            
            // Nếu gửi lên name/email (tức là đã đăng nhập)
            if (name && email) {
                // Nếu tên/email khác với DB (họ vừa đăng nhập, hoặc đăng nhập nick khác)
                if (v.email !== email || v.name === "Khách vãng lai") {
                    visitDoc.visitors[existingVisitorIndex].name = name;
                    visitDoc.visitors[existingVisitorIndex].email = email;
                    visitDoc.visitors[existingVisitorIndex].time = new Date(); // Cập nhật giờ mới nhất
                    isUpdated = true;
                }
            }
            // Nếu không gửi name/email (chưa đăng nhập), giữ nguyên tên cũ trong DB, KHÔNG ghi đè
        } else {
            // IP mới hoàn toàn trong ngày
            visitDoc.visitors.push({
                ip,
                name: name || "Khách vãng lai",
                email: email || ""
            });
            isUpdated = true;
        }

        if (isUpdated) {
            await visitDoc.save();
            // Bắn socket cập nhật số lượng và danh sách cho Admin (nếu Admin đang mở)
            io.emit("dailyVisitorUpdate", visitDoc.visitors.length);
            io.emit("visitorsListUpdate", visitDoc.visitors.sort((a, b) => b.time - a.time));
        }

        res.status(200).json({ count: visitDoc.visitors.length });
    } catch (error) {
        console.error("Lỗi trackVisit:", error);
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
        console.error("Lỗi getDailyVisits:", error);
        res.status(500).json({ message: "Server error" });
    }
};