import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Username is required"] },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: [6, "Password must be at least 6 characters long"] },
    phoneNumber: { type: String },
    direction: { type: String },

    // --- QUAN TRỌNG: Thêm dòng này để lưu link ảnh ---
    avatar: { type: String, default: "" },
    // -------------------------------------------------

    provider: { type: String, enum: ["local", "facebook"], default: "local" },
    facebookId: { type: String, unique: false, sparse: true },

    cartItems: [
      {
        quantity: { type: Number, default: 1 },
        size: { type: String, default: "M" }, 
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      },
    ],
    role: { type: String, enum: ["customer", "admin", "controller"], default: "customer" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;