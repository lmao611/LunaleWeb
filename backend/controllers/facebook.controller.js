import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: "Access token is required" });
    }

    // 📡 Lấy thông tin người dùng từ Facebook Graph API
    const fbRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );

    const { id, name, email, picture } = fbRes.data;

    if (!email) {
      return res.status(400).json({ message: "Facebook account has no email" });
    }

    // 👤 Tìm hoặc tạo user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: id, // có thể random chuỗi khác nếu muốn
        avatar: picture?.data?.url || "",
      });
    }

    // 🔐 Tạo JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 🍪 Gửi cookie JWT về client
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // chỉ HTTPS khi production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // quan trọng để cookie gửi qua domain khác
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Facebook login successful",
      user,
      token,
    });
  } catch (err) {
    console.error("❌ Facebook login error:", err.response?.data || err.message);
    res.status(500).json({ message: "Facebook login failed" });
  }
};
