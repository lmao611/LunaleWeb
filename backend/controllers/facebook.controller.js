import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: "Access token is required" });
    }

    
    const fbRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );

    const { id, name, email, picture } = fbRes.data;

    if (!email) {
      return res.status(400).json({ message: "Facebook account has no email" });
    }

    
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: id, 
        avatar: picture?.data?.url || "",
      });
    }

    
    const token = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Facebook login successful",
      user,
    });
  } catch (err) {
    const fbError = err.response?.data?.error?.message || err.message;
    console.error("❌ Facebook login error:", fbError);
    res.status(500).json({ message: `Facebook login failed: ${fbError}` });
  }
};

