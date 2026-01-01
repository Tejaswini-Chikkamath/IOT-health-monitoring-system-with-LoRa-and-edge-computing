import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPatientByAadhaar } from "../services/db";
import { motion } from "framer-motion";
import backgroundImage from "../assets/background1.jpg";

export default function PatientLogin() {
  const [aadhaar, setAadhaar] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!aadhaar.trim()) return setError("Enter Aadhaar ID");

    const patient = await getPatientByAadhaar(aadhaar.trim());
    if (patient) {
      localStorage.setItem("patient_aadhaar", aadhaar.trim());
      nav(`/patient-dashboard/${aadhaar.trim()}`);
    } else {
      setError("❌ Patient not found");
    }
  };

  const handleBack = () => {
    nav("/"); // Navigate to landing page
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Back Button over image */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 z-20 bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition"
      >
        ← Back
      </button>

      {/* Login Form */}
      <motion.form
        onSubmit={handleLogin}
        className="relative bg-white rounded-xl shadow-2xl p-10 w-[90%] max-w-md z-10 flex flex-col"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-bold text-green-600 mb-6 text-center">
          Patient Login
        </h2>

        <input
          type="text"
          placeholder="Enter Aadhaar ID"
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        {error && <p className="text-red-600 mb-3 text-center">{error}</p>}

        <button
          type="submit"
          className="w-full bg-green-600 text-white rounded-lg py-3 text-lg hover:bg-green-700 transition"
        >
          Login
        </button>
      </motion.form>
    </div>
  );
}
