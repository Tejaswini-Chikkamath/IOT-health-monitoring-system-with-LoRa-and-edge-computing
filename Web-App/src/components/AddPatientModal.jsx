import { useState } from "react";
import { createPatientIfNotExists } from "../services/db";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Hash,
  Calendar,
  MapPin,
  Venus,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function AddPatientModal({ open, onClose }) {
  const [form, setForm] = useState({
    aadhaar: "",
    name: "",
    age: "",
    gender: "",
    area: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const info = { ...form, age: Number(form.age) };
    const res = await createPatientIfNotExists(info);
    setBusy(false);
    setMsg(res.ok ? "✅ Patient created successfully!" : `⚠️ ${res.reason}`);
    if (res.ok) setForm({ aadhaar: "", name: "", age: "", gender: "", area: "" });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 grid place-items-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="relative bg-white/20 backdrop-blur-2xl rounded-2xl w-[95%] max-w-2xl p-8 shadow-2xl border border-white/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Border Glow */}
            <div className="absolute inset-0 rounded-2xl border-4 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse opacity-20"></div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-200 hover:text-white z-10"
            >
              <X size={24} />
            </button>

            <h2 className="text-4xl font-extrabold mb-6 text-center text-white drop-shadow-lg">
              ✨ Add Patient
            </h2>

            <form
              onSubmit={submit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
            >
              {/* Aadhaar */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-200 font-medium mb-1 flex items-center gap-1">
                  <Hash size={16} /> Aadhaar Number
                </label>
                <div className="flex items-center border rounded-lg bg-white/90 px-3">
                  <Hash size={18} className="text-gray-500 mr-2" />
                  <input
                    required
                    name="aadhaar"
                    value={form.aadhaar}
                    onChange={change}
                    className="w-full bg-transparent py-2 focus:outline-none text-gray-800"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-200 font-medium mb-1 flex items-center gap-1">
                  <User size={16} /> Full Name
                </label>
                <div className="flex items-center border rounded-lg bg-white/90 px-3">
                  <User size={18} className="text-gray-500 mr-2" />
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={change}
                    className="w-full bg-transparent py-2 focus:outline-none text-gray-800"
                  />
                </div>
              </div>

              {/* Age */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-200 font-medium mb-1 flex items-center gap-1">
                  <Calendar size={16} /> Age
                </label>
                <div className="flex items-center border rounded-lg bg-white/90 px-3">
                  <Calendar size={18} className="text-gray-500 mr-2" />
                  <input
                    required
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={change}
                    className="w-full bg-transparent py-2 focus:outline-none text-gray-800"
                  />
                </div>
              </div>

              {/* Area */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-200 font-medium mb-1 flex items-center gap-1">
                  <MapPin size={16} /> Area
                </label>
                <div className="flex items-center border rounded-lg bg-white/90 px-3">
                  <MapPin size={18} className="text-gray-500 mr-2" />
                  <input
                    required
                    name="area"
                    value={form.area}
                    onChange={change}
                    className="w-full bg-transparent py-2 focus:outline-none text-gray-800"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-200 font-medium mb-1 flex items-center gap-1">
                  <Venus size={16} /> Gender
                </label>
                <select
                  required
                  name="gender"
                  value={form.gender}
                  onChange={change}
                  className="w-full border rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800"
                >
                  <option value="">-- Select Gender --</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="md:col-span-2 flex gap-3 mt-4 justify-center">
                <button
                  disabled={busy}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg shadow-lg transition flex items-center gap-2"
                >
                  {busy ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    "💾 Save"
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition bg-white/80"
                >
                  ❌ Close
                </button>
              </div>

              {/* Message */}
              {msg && (
                <div
                  className={`md:col-span-2 mt-3 text-sm px-3 py-2 rounded-lg flex items-center gap-2 ${
                    msg.startsWith("✅")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {msg.startsWith("✅") && <CheckCircle size={18} />}
                  {msg}
                </div>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
