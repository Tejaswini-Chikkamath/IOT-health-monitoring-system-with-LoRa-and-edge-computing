import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import backgroundImage from "../assets/background1.jpg";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Back Button */}
      <motion.button
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onClick={() => nav("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-white font-semibold bg-white/20 px-4 py-2 rounded-lg shadow-lg hover:bg-white/30 transition"
      >
        <ArrowLeft size={20} /> Back
      </motion.button>

      {/* Glass Card */}
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl w-[90%] max-w-md p-10 border border-white/30"
      >
        {/* Animated Gradient Heading */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl font-extrabold text-center text-green-500 drop-shadow-md"
        >
          ADMIN LOGIN
        </motion.h1>
               {/* <motion.h1
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.8 }}
  className="text-4xl font-extrabold tracking-wide text-black-500 drop-shadow-md"
>
  ADMIN LOGIN
</motion.h1> */}

        {/* Email */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-5"
        >
          <label className="text-white text-sm mb-1 block">Email</label>
          <input
            className="w-full border border-white/40 bg-white/20 text-white placeholder-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative mb-6"
        >
          <label className="text-white text-sm mb-1 block">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full border border-white/40 bg-white/20 text-white placeholder-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
          >
            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        </motion.div>

        {/* Error */}
        {err && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-red-400 text-center text-sm mb-4"
          >
            {err}
          </motion.div>
        )}

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-500 text-white text-lg font-semibold rounded-lg py-3 shadow-lg transition-transform transform"
        >
          Login
        </motion.button>
      </motion.form>
    </div>
  );
}
