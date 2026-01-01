import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import AddPatientModal from "../components/AddPatientModal";
import { getPatientByAadhaar } from "../services/db"; // ✅ import to check Aadhaar
import backgroundImage from "../assets/background5.jpg";

export default function Dashboard() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    if (!search.trim()) return alert("Please enter an Aadhaar number");
    setLoading(true);
    const patient = await getPatientByAadhaar(search.trim());
    setLoading(false);

    if (patient) {
      nav(`/patient/${search.trim()}`);
    } else {
      alert("No patient found with that Aadhaar number");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start bg-fixed bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        filter: "brightness(1.2)",
      }}
    >
      {/* 🔹 Overlay */}
      <div className="absolute inset-0 bg-black/20 z-0"></div>

      {/* 🔹 Topbar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-wrap items-center justify-between w-full gap-4 p-6 
                   bg-gradient-to-r from-blue-700/80 via-blue-600/80 to-blue-700/80 
                   backdrop-blur-lg shadow-lg border-b border-white/30"
      >
        {/* Back Button */}
        <button
          onClick={() => nav("/")}
          className="flex items-center gap-2 text-white font-semibold bg-white/20 px-4 py-2 rounded-lg shadow hover:bg-white/30 transition"
        >
          <ArrowLeft size={20} /> Back
        </button>

        {/* Dashboard Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-extrabold tracking-wide text-green-400 drop-shadow-md"
        >
          ADMIN DASHBOARD
        </motion.h1>

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition"
          >
            + Add Patient
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => nav("/patients")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition"
          >
            View All
          </motion.button>
        </div>
      </motion.div>

      {/* 🔹 Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 flex flex-col items-center justify-center mt-32 px-6"
      >
        {/* Search Bar */}
        <div className="flex bg-white/80 rounded-full overflow-hidden shadow-lg w-full max-w-xl border border-gray-200">
          <input
            type="text"
            placeholder="Search by Aadhaar number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow px-5 py-3 text-gray-800 text-lg bg-transparent focus:outline-none"
          />
          <button
            onClick={doSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold flex items-center gap-2 transition"
          >
            <Search size={20} />
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </motion.div>

      {/* Add Patient Modal */}
      <AddPatientModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
