// import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// ⬇️ paste your config from Firebase console
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgfQaad48F5w-7pzb52xD2ToH7FdlSg6c",
  authDomain: "iot---health-monitoring-app.firebaseapp.com",
  databaseURL: "https://iot---health-monitoring-app-default-rtdb.firebaseio.com",
  projectId: "iot---health-monitoring-app",
  storageBucket: "iot---health-monitoring-app.firebasestorage.app",
  messagingSenderId: "915103011808",
  appId: "1:915103011808:web:4c37958e36f34197e1d185"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
