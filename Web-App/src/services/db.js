import { rtdb } from "../firebase";
import {
  ref,
  set,
  get,
  push,
  query,
  orderByChild,
  equalTo,
  onValue,
} from "firebase/database";

// Create patient if not exists
export const createPatientIfNotExists = async (info) => {
  const key = info.aadhaar.trim();
  const patientRef = ref(rtdb, `patients/${key}/info`);
  const exists = (await get(patientRef)).exists();
  if (exists) return { ok: false, reason: "Patient already exists" };
  await set(patientRef, info);
  return { ok: true };
};

// Get patients by area
export const getPatientsByArea = async (area) => {
  const q = query(ref(rtdb, "patients"), orderByChild("info/area"), equalTo(area));
  const snap = await get(q);
  const out = [];
  if (snap.exists()) {
    snap.forEach((childSnap) => {
      const val = childSnap.val();
      out.push({
        aadhaar: childSnap.key,
        info: val.info || {},
        records: val.records || {},
        ml_insights: val.ml_insights || {},
      });
    });
  }
  return out;
};

// Get single patient by Aadhaar
export const getPatientByAadhaar = async (aadhaar) => {
  const snap = await get(ref(rtdb, `patients/${aadhaar}`));
  if (!snap.exists()) return null;
  const val = snap.val();
  return {
    aadhaar,
    info: val.info || {},
    records: val.records || {},
    ml_insights: val.ml_insights || {},
  };
};

// Live listeners
export const listenVitals = (aadhaar, cb) =>
  onValue(ref(rtdb, `patients/${aadhaar}/records`), (snap) => cb(snap.val() || {}));

// ✅ Handles both single-object and multi-insights
export const listenInsights = (aadhaar, cb) => {
  const refPath = ref(rtdb, `patients/${aadhaar}/ml_insights`);
  return onValue(refPath, (snap) => {
    const data = snap.val();
    if (!data) return cb({});
    if (data.diagnosis) cb({ single: data }); // single flat object
    else cb(data);
  });
};
