import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, Lock, Loader, LogIn, ArrowRight, Facebook } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, setUser } = useUserStore();
  const [fbLoading, setFbLoading] = useState(false);

  // --- Load Facebook SDK ---
  useEffect(() => {
    if (window.FB) return;
    window.fbAsyncInit = function () {
      FB.init({
        appId: "1365209865023366", // 👉 thay bằng App ID thật
        cookie: true,
        xfbml: false,
        version: "v17.0",
      });
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // --- Login form thường ---
  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  // --- Facebook login (không dùng async function trực tiếp) ---
  const handleFacebookLogin = () => {
  setFbLoading(true);
  FB.login(
    (response) => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;

        // ✅ dùng biến môi trường API URL
        const apiBase = import.meta.env.VITE_API_URL;

        fetch(`${apiBase}/api/auth/facebook/login`, {

          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // ✅ cho phép gửi cookie từ server về
          body: JSON.stringify({ accessToken }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(errText || "Request failed");
            }
            return res.json();
          })
          .then((data) => {
            if (data.token) {
              localStorage.setItem("token", data.token);
              setUser(data.user);
            } else {
              alert(data.message || "Đăng nhập Facebook thất bại");
            }
          })
          .catch((err) => {
            console.error("❌ Facebook login error:", err);
            alert("Đăng nhập Facebook thất bại");
          })
          .finally(() => setFbLoading(false));
      } else {
        alert("Bạn đã hủy đăng nhập Facebook");
        setFbLoading(false);
      }
    },
    { scope: "email" }
  );
};


  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8 pt-0">
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-700">
          Đăng nhập
        </h2>
      </motion.div>

      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="bg-white border border-gray-200 py-8 px-6 shadow-lg sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 pl-10 bg-white border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pl-10 bg-white border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-2 text-gray-500 text-sm">hoặc</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            onClick={handleFacebookLogin}
            disabled={fbLoading}
            className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-[#1877f2] hover:bg-[#166fe5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877f2] transition disabled:opacity-50"
          >
            {fbLoading ? (
              <>
                <Loader className="mr-2 h-5 w-5 animate-spin" />
                Đang đăng nhập Facebook...
              </>
            ) : (
              <>
                <Facebook className="mr-2 h-5 w-5" />
                Đăng nhập bằng Facebook
              </>
            )}
          </button>

          <p className="mt-8 text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500 inline-flex items-center"
            >
              Đăng ký ngay
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
