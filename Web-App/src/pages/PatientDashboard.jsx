import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartPulse, Thermometer, Activity, Droplets } from "lucide-react";
import { Sparklines, SparklinesLine } from "react-sparklines";
import { getPatientByAadhaar, listenVitals, listenInsights } from "../services/db";
import backgroundImage from "../assets/background.jpg";

export default function PatientDashboard() {
  const { aadhaar } = useParams();
  const nav = useNavigate(); // Navigate hook
  const [info, setInfo] = useState(null);
  const [records, setRecords] = useState({});
  const [insights, setInsights] = useState({});

  useEffect(() => {
    (async () => {
      const p = await getPatientByAadhaar(aadhaar);
      setInfo(p?.info || null);
    })();

    const off1 = listenVitals(aadhaar, setRecords);
    const off2 = listenInsights(aadhaar, setInsights);

    return () => {
      off1();
      off2();
    };
  }, [aadhaar]);

  const latestRecord = (() => {
    const ids = Object.keys(records || {});
    if (ids.length === 0) return null;
    const sorted = ids.sort(
      (a, b) => (records[b]?.timestamp || 0) - (records[a]?.timestamp || 0)
    );
    return records[sorted[0]];
  })();

  const insightList = Object.entries(insights || {}).sort(
    (a, b) => b[1].created_at - a[1].created_at
  );

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("patient_aadhaar"); // Clear stored Aadhaar
    nav("/patient-login"); // Redirect to login page
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-6xl mx-auto p-8 space-y-8">
        {/* Logout Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Greeting Header */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/30"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-3xl font-bold text-white mb-6">
            {info ? `👋 Hello, ${info.name.split(" ")[0]}` : "👋 Hello"}
          </div>
          {info ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white/90 text-lg">
              <InfoItem label="Aadhaar" value={info.aadhaar} />
              <InfoItem label="Age" value={info.age} />
              <InfoItem label="Gender" value={info.gender} />
              <InfoItem label="Area" value={info.area} colSpan={2} />
            </div>
          ) : (
            <p className="text-gray-300 text-lg">Loading…</p>
          )}
        </motion.div>

        {/* Latest Vitals */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/30"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            💓 Latest Vitals
          </div>
          {latestRecord ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Vital
                icon={<HeartPulse className="text-red-400 w-8 h-8 animate-pulse" />}
                label="Heart Rate"
                value={latestRecord.heart_rate?.slice(-1)[0]}
                data={latestRecord.heart_rate || []}
                unit="bpm"
              />
              <Vital
                icon={<Droplets className="text-sky-400 w-8 h-8 animate-pulse" />}
                label="SpO₂"
                value={latestRecord.spo2?.slice(-1)[0]}
                data={latestRecord.spo2 || []}
                unit="%"
              />
              <Vital
                icon={<Thermometer className="text-orange-400 w-8 h-8 animate-pulse" />}
                label="Temperature"
                value={latestRecord.temperature?.slice(-1)[0]}
                data={latestRecord.temperature || []}
                unit="°C"
              />
              <Vital
                icon={<Activity className="text-green-400 w-8 h-8 animate-pulse" />}
                label="ECG"
                value={latestRecord.ecg?.slice(-1)[0]}
                data={latestRecord.ecg || []}
              />
            </div>
          ) : (
            <p className="text-gray-300 text-lg">No records yet.</p>
          )}
          {latestRecord && (
            <div className="text-sm text-gray-300 mt-3">
              ⏱ Updated: {new Date((latestRecord.timestamp || 0) * 1000).toLocaleString()}
            </div>
          )}
        </motion.div>

        {/* ML Insights */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/30"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            🤖 ML Insights
          </div>
          {insightList.length === 0 ? (
            <p className="text-gray-300 text-lg">No insights yet.</p>
          ) : (
            <div className="space-y-4">
              {insightList.map(([id, ins]) => (
                <motion.div
                  key={id}
                  className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-md hover:bg-white/20 transition"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-white font-semibold text-lg">
                    {ins.diagnosis}{" "}
                    <span className="text-sm text-gray-300">
                      ({Math.round((ins.confidence || 0) * 100)}%)
                    </span>
                  </div>
                  {ins.recommendation && (
                    <div className="text-gray-200 text-base mt-2">{ins.recommendation}</div>
                  )}
                  <div className="text-sm text-gray-400 mt-2">
                    🕒 {new Date(ins.created_at * 1000).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Vital Card with Sparkline
function Vital({ icon, label, value, data, unit }) {
  const displayValue =
    value !== undefined && !isNaN(value)
      ? Number(value).toFixed(1) + (unit ? ` ${unit}` : "")
      : "--" + (unit ? ` ${unit}` : "");

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow text-center hover:scale-105 transition-transform duration-300"
    >
      <div className="flex justify-center mb-3">{icon}</div>
      <div className="text-gray-200 text-base font-medium">{label}</div>
      <div className="text-3xl font-bold text-white">{displayValue}</div>
      {data.length > 1 && (
        <Sparklines data={data.slice(-20)} className="mt-3 h-10">
          <SparklinesLine color="white" />
        </Sparklines>
      )}
    </motion.div>
  );
}

// Info Item
function InfoItem({ label, value, colSpan = 1 }) {
  return (
    <div className={`col-span-${colSpan} bg-white/10 p-4 rounded-2xl shadow text-white`}>
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
