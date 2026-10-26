/**
 * Lấy IP thật của client.
 *
 * Web đang chạy sau Cloudflare -> Render. Header `cf-connecting-ip` do Cloudflare
 * gắn và KHÔNG thể bị client tự đặt khi đi qua proxy của Cloudflare.
 * Ưu tiên header này để tránh trường hợp mọi request bị gộp chung một IP
 * (khiến rate-limit chặn cả site), đồng thời tránh việc client xoay
 * `X-Forwarded-For` để né khoá đăng nhập.
 */
export const getClientIp = (req) => {
  const cf = req.headers["cf-connecting-ip"];
  if (typeof cf === "string" && cf.trim()) return cf.trim();

  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    // Phần tử đầu tiên là IP gốc do proxy gắn
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
};

/** Khoá rate-limit an toàn (IP có thể chứa ký tự lạ) */
export const ipKey = (req) => getClientIp(req).replace(/[^a-zA-Z0-9.:_-]/g, "_");
