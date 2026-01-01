import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import { getPatientsByArea, getPatientByAadhaar } from "../services/db";
import PatientCard from "../components/PatientCard";
import backgroundImage from "../assets/background1.jpg"; // your background image

export default function Patients() {
  const nav = useNavigate();
  const area = localStorage.getItem("admin_area") || "";
  const [search, setSearch] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load patients by area
  useEffect(() => {
    (async () => {
      setLoading(true);
      const l = await getPatientsByArea(area);
      setList(l);
      setLoading(false);
    })();
  }, [area]);

  // Search Aadhaar
  const doSearch = async () => {
    if (!search.trim()) return;
    const p = await getPatientByAadhaar(search.trim());
    if (p && p.info.area === area) {
      nav(`/patient/${search.trim()}`);
    } else {
      alert("No patient found with that Aadhaar in your area");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>

      {/* Topbar */}
      <div className="relative z-10">
        <Topbar title="Patients">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Aadhaar…"
              className="px-4 py-2 rounded-lg border text-black placeholder-gray-400 shadow-lg bg-white/80 backdrop-blur-md focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={doSearch}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </Topbar>
      </div>

      {/* Area Display */}
      <div className="relative z-10 text-center mt-10">
        <h2 className="text-4xl font-bold text-aqua drop-shadow-lg">
  🏥 Area:{" "}
  <span
    className="text-4xl font-extrabold tracking-wide text-green-500 drop-shadow-md"
  >
    {area || "Not Assigned"}
  </span>
</h2>

      </div>

      {/* Patients Grid */}
      <div className="relative z-10 max-w-6xl mx-auto p-6 mt-8">
        {loading ? (
          <p className="text-center text-gray-200 text-xl">
            Loading patients…
          </p>
        ) : list.length === 0 ? (
          <p className="text-center text-gray-300 text-xl">
            No patients yet. Click “Add Patient”.
          </p>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <PatientCard
                key={p.aadhaar}
                patient={p}
                onClick={() => nav(`/patient/${p.aadhaar}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
