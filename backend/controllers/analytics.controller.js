import Visit from "../models/visit.model.js";
import { emitToAdmins } from "../lib/socket.js";
import { getClientIp } from "../lib/requestIp.js";

export const trackVisit = async (req, res) => {
  try {
    const ip = getClientIp(req);

    const today = new Date();
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(today);

    let visitDoc = await Visit.findOne({ date: dateStr });
    if (!visitDoc) {
      visitDoc = new Visit({ date: dateStr, visitors: [] });
    }

    // Danh tính CHỈ lấy từ token đã xác thực, không lấy từ body
    // (trước đây client có thể gửi tên/email bất kỳ).
    const name = req.user?.name || "Khách vãng lai";
    const email = req.user?.email || "";

    const existingVisitorIndex = visitDoc.visitors.findIndex((v) => v.ip === ip);
    let isUpdated = false;

    if (existingVisitorIndex !== -1) {
      const v = visitDoc.visitors[existingVisitorIndex];

      if (req.user && (v.email !== email || v.name === "Khách vãng lai")) {
        visitDoc.visitors[existingVisitorIndex].name = name;
        visitDoc.visitors[existingVisitorIndex].email = email;
        visitDoc.visitors[existingVisitorIndex].time = new Date();
        isUpdated = true;
      }
    } else {
      visitDoc.visitors.push({ ip, name, email: email || "" });
      isUpdated = true;
    }

    if (isUpdated) {
      await visitDoc.save();
      // Số lượng thì công khai, danh sách chi tiết (có IP/email) chỉ admin thấy
      emitToAdmins("dailyVisitorUpdate", visitDoc.visitors.length);
      emitToAdmins(
        "visitorsListUpdate",
        visitDoc.visitors.slice().sort((a, b) => b.time - a.time)
      );
    }

    res.status(200).json({ count: visitDoc.visitors.length });
  } catch (error) {
    console.error("[TRACK VISIT]", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDailyVisits = async (req, res) => {
  try {
    const today = new Date();
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(today);

    const visitDoc = await Visit.findOne({ date: dateStr });
    if (!visitDoc) {
      return res.status(200).json({ count: 0, visitors: [] });
    }

    const sortedVisitors = visitDoc.visitors.slice().sort((a, b) => b.time - a.time);
    res.status(200).json({ count: visitDoc.visitors.length, visitors: sortedVisitors });
  } catch (error) {
    console.error("[DAILY VISITS]", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
