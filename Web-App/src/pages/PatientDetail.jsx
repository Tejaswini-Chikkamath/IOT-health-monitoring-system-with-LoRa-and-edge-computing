import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartPulse, Thermometer, Activity, Droplets } from "lucide-react";
import Topbar from "../components/Topbar";
import {
  getPatientByAadhaar,
  listenVitals,
  listenInsights,
} from "../services/db";
import backgroundImage from "../assets/background1.jpg";

export default function PatientDetail() {
  const { aadhaar } = useParams();
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

  // 🩺 Find latest vital record
  const latestRecord = (() => {
    const ids = Object.keys(records || {});
    if (ids.length === 0) return null;
    const sorted = ids.sort(
      (a, b) => (records[b]?.timestamp || 0) - (records[a]?.timestamp || 0)
    );
    return records[sorted[0]];
  })();

  // 🧠 Handle both single and multiple ML insights
  const insightArray = (() => {
    if (!insights || Object.keys(insights).length === 0) return [];
    if (insights.single) return [insights.single];
    if (insights.diagnosis) return [insights]; // single flat insight
    return Object.values(insights);
  })();

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative z-10">
        <Topbar title={`Patient • ${aadhaar}`} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-8 space-y-8">
        {/* 👤 Patient Info */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/30"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            👤 Patient Info
          </div>
          {info ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white/90 text-lg">
              <InfoItem label="Aadhaar" value={info.aadhaar} />
              <InfoItem label="Name" value={info.name} />
              <InfoItem label="Age" value={info.age} />
              <InfoItem label="Gender" value={info.gender} />
              <InfoItem label="Area" value={info.area} colSpan={2} />
            </div>
          ) : (
            <p className="text-gray-300 text-lg">Loading…</p>
          )}
        </motion.div>

        {/* 💓 Latest Vitals */}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <Vital
                icon={<HeartPulse className="text-red-400 w-8 h-8 animate-pulse" />}
                label="Heart Rate"
                value={latestRecord.heart_rate}
                unit="bpm"
              />
              <Vital
                icon={<Droplets className="text-sky-400 w-8 h-8 animate-pulse" />}
                label="SpO₂"
                value={latestRecord.spo2}
                unit="%"
              />
              <Vital
                icon={<Thermometer className="text-orange-400 w-8 h-8 animate-pulse" />}
                label="Temperature"
                value={latestRecord.temperature}
                unit="°C"
              />
              <Vital
                icon={<Activity className="text-green-400 w-8 h-8 animate-pulse" />}
                label="ECG"
                value={latestRecord.ecg_avg}
              />
            </div>
          ) : (
            <p className="text-gray-300 text-lg">No records yet.</p>
          )}
          {latestRecord && (
            <div className="text-sm text-gray-300 mt-3">
              ⏱ Updated: {formatTimestamp(latestRecord.timestamp)}
            </div>
          )}
        </motion.div>

        {/* 🤖 ML Insights */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/30"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            🤖 ML Insights
          </div>

          {insightArray.length === 0 ? (
            <p className="text-gray-300 text-lg">No insights yet.</p>
          ) : (
            <div className="space-y-4">
              {insightArray.map((ins, i) => (
                <motion.div
                  key={i}
                  className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-md hover:bg-white/20 transition"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-white font-semibold text-lg">
                    🧠 {ins.diagnosis || "N/A"}
                  </div>

                  {ins.recommendation && (
                    <div className="text-gray-200 text-base mt-2">
                      🩺 {ins.recommendation}
                    </div>
                  )}

                  {ins.record_used && (
                    <div className="text-gray-300 text-sm mt-1">
                      📁 Record Used: {ins.record_used}
                    </div>
                  )}

                  <div className="text-sm text-gray-400 mt-2">
                    🕒 {formatTimestamp(ins.timestamp)}
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

// 🕒 Timestamp Formatter
function formatTimestamp(ts) {
  if (!ts) return "N/A";
  try {
    let date;
    if (typeof ts === "object" && ts.seconds)
      date = new Date(ts.seconds * 1000);
    else if (typeof ts === "number")
      date = new Date(ts < 1e12 ? ts * 1000 : ts);
    else if (typeof ts === "string")
      date = new Date(ts.replace(" ", "T"));
    if (isNaN(date)) return "Invalid Date";
    return date.toLocaleString();
  } catch {
    return "Invalid Date";
  }
}

// 💓 Vital Card
function Vital({ icon, label, value, unit }) {
  const displayValue =
    value !== undefined && value !== null && !isNaN(value)
      ? `${value} ${unit || ""}`
      : "--";
  return (
    <motion.div
      className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow text-center hover:scale-105 transition-transform duration-300"
      whileHover={{ y: -5 }}
    >
      <div className="flex justify-center mb-3">{icon}</div>
      <div className="text-gray-200 text-base font-medium">{label}</div>
      <div className="text-3xl font-bold text-white">{displayValue}</div>
    </motion.div>
  );
}

// 📋 Info Card
function InfoItem({ label, value, colSpan = 1 }) {
  return (
    <div
      className={`col-span-${colSpan} bg-white/10 p-4 rounded-2xl shadow text-white`}
    >
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-2xl font-bold mt-1">{value || "N/A"}</div>
    </div>
  );
}
  