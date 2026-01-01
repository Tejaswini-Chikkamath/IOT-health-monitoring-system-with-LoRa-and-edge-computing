import { motion } from "framer-motion";

export default function PatientCard({ patient, onClick }) {
  const info = patient.info || {};
  const initials = info.name
    ? info.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="cursor-pointer bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 border-l-4 border-gradient-to-r from-teal-400 via-blue-500 to-purple-500"
    >
      {/* Avatar Circle */}
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold text-lg mb-4">
        {initials}
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">
        {info.name || "Unknown"}
      </h2>

      <p className="text-sm text-gray-600 mb-1">
        🆔 Aadhaar: <span className="font-medium">{info.aadhaar}</span>
      </p>

      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
        🎂 Age: <span className="font-medium">{info.age} yrs</span>
      </p>

      <p className="text-sm mb-1 flex items-center gap-2">
        👥 Gender:
        <span
          className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${
            info.gender === "Male"
              ? "bg-blue-500"
              : info.gender === "Female"
              ? "bg-pink-500"
              : "bg-purple-500"
          }`}
        >
          {info.gender || "Unknown"}
        </span>
      </p>

      <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
        📍 Area: <span className="font-medium">{info.area}</span>
      </p>
    </motion.div>
  );
}
