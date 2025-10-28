import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: "Access token is required" });
    }

    // Lấy thông tin người dùng từ Facebook Graph API
    const response = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );

    const { id, name, email, picture } = response.data;

    if (!email) {
      return res.status(400).json({ message: "Facebook account has no email" });
    }

    // Kiểm tra user trong database
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: id, // bạn có thể random 1 chuỗi nếu muốn
        avatar: picture?.data?.url || "",
      });
    }

    // Tạo JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Gửi cookie + dữ liệu user về client
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      message: "Facebook login successful",
      user,
      token,
    });
  } catch (err) {
    console.error("Facebook login error:", err.message);
    res.status(500).json({ message: "Facebook login failed" });
  }
};
