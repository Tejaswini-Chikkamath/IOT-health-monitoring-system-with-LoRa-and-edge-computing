import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";                // Admin Login
import Dashboard from "./pages/Dashboard";        // Admin Dashboard
import Patients from "./pages/Patients";          // Admin Patients List
import PatientDetail from "./pages/PatientDetail";// Admin: Patient Details
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";            // Entry: choose Admin or Patient
import PatientLogin from "./pages/PatientLogin";  // Patient Aadhaar Login
import PatientDashboard from "./pages/PatientDashboard"; // Patient own view

export default function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Admin Routes */}
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patient/:aadhaar" element={<PatientDetail />} />
      </Route>

      {/* Patient Routes */}
      <Route path="/patient-login" element={<PatientLogin />} />
      <Route path="/patient-dashboard/:aadhaar" element={<PatientDetail />} />

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
