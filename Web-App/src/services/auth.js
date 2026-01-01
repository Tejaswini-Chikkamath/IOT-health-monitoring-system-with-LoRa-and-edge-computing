import { auth, rtdb } from "../firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);

// fetch current user profile (role, area)
export const fetchMyProfile = async (uid) => {
  const snap = await get(ref(rtdb, `users/${uid}`));
  return snap.exists() ? snap.val() : null;
};

export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
