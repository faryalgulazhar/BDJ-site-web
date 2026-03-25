import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmoekvwBA4tdm40F4sgSv-cCHF2AxQUvM",
  authDomain: "bdj-karukera.firebaseapp.com",
  projectId: "bdj-karukera",
  storageBucket: "bdj-karukera.firebasestorage.app",
  messagingSenderId: "826699093406",
  appId: "1:826699093406:web:48b83e33bd77833c60b28f",
};

// Avoid initializing Firebase more than once (safe for Next.js hot reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
