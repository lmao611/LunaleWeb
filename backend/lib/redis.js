import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  retryStrategy: (times) => Math.min(times * 500, 5000),
});

// Bắt buộc phải có listener 'error', nếu không Node sẽ crash cả process
// khi Redis mất kết nối (ví dụ lúc đổi mật khẩu Upstash).
redis.on("error", (err) => {
  console.error("[REDIS ERROR]", err.message);
});
