import crypto from "crypto";

// Lấy key từ file .env. Nếu không có, dùng fallback.
// Key phải là chuỗi hex 64 ký tự (32 bytes).
const getEncryptionKey = () => {
    const envKey = process.env.ENCRYPTION_KEY;
    if (envKey) {
        // Parse hex string to buffer. Ensure it's 32 bytes.
        return Buffer.from(envKey.padEnd(64, '0').slice(0, 64), 'hex');
    }
    // Fallback key just in case it's not set so the server doesn't crash, 
    // but data encrypted with fallback will be lost if server restarts.
    return Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "hex");
};

const IV_LENGTH = 16; 

export const encryptJSON = (data) => {
    try {
        const text = JSON.stringify(data);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    } catch (error) {
        console.error("Encryption error:", error);
        return null;
    }
};

export const decryptJSON = (encryptedText) => {
    try {
        if (!encryptedText) return null;
        const textParts = encryptedText.split(":");
        const iv = Buffer.from(textParts.shift(), "hex");
        const encryptedTextBuffer = Buffer.from(textParts.join(":"), "hex");
        
        try {
            // Thử giải mã bằng key chính (từ .env)
            const decipher = crypto.createDecipheriv("aes-256-cbc", getEncryptionKey(), iv);
            let decrypted = decipher.update(encryptedTextBuffer, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return JSON.parse(decrypted);
        } catch (err) {
            // Nếu giải mã bằng key chính thất bại (do đổi key hoặc lúc mã hóa dùng fallback key)
            // Thử giải mã bằng fallback key gốc
            console.log("⚠️ Main key failed, trying fallback key for decryption...");
            const fallbackKey = Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "hex");
            const decipherFallback = crypto.createDecipheriv("aes-256-cbc", fallbackKey, iv);
            let decryptedFallback = decipherFallback.update(encryptedTextBuffer, "hex", "utf8");
            decryptedFallback += decipherFallback.final("utf8");
            return JSON.parse(decryptedFallback);
        }
    } catch (error) {
        console.error("Decryption error:", error);
        return null;
    }
};
