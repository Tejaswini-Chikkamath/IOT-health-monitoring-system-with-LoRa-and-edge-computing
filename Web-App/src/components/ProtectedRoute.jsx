import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { watchAuth, fetchMyProfile } from "../services/auth";

export default function ProtectedRoute() {
  const [status, setStatus] = useState({ loading: true, allow: false });

  useEffect(() => {
    const off = watchAuth(async (user) => {
      if (!user) return setStatus({ loading: false, allow: false });
      const profile = await fetchMyProfile(user.uid);
      const isAdmin = profile?.role === "admin";
      // stash the area for queries
      if (isAdmin) localStorage.setItem("admin_area", profile.area || "");
      setStatus({ loading: false, allow: isAdmin });
    });
    return () => off();
  }, []);

  if (status.loading) {
    return <div className="h-screen grid place-items-center text-xl">Loading…</div>;
  }
  return status.allow ? <Outlet /> : <Navigate to="/login" replace />;
}
