"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";

const friendlyError = (code: string): string => {
  switch (code) {
    case "auth/email-already-in-use": return "This email is already registered.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    default: return "Something went wrong. Please try again.";
  }
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gamerTag, setGamerTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Persist Gamer Tag and user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        gamerTag: gamerTag || "New Player",
        email: user.email,
        uid: user.uid,
        createdAt: serverTimestamp(),
        role: "member"
      });

      router.push("/planning");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(friendlyError(err.code));
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile already exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          gamerTag: user.displayName || "New Player",
          email: user.email,
          uid: user.uid,
          createdAt: serverTimestamp(),
          role: "member"
        });
      }

      router.push("/planning");
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="absolute top-10 left-10">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold tracking-widest uppercase">Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-[#161616] border border-white/5 rounded-[2.5rem] p-10 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[100px] bg-red-500/5 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm">Join the BDJ Karukera ecosystem today.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Gamer Tag"
              required
              value={gamerTag}
              onChange={(e) => setGamerTag(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 outline-none rounded-xl pl-12 pr-4 py-4 text-sm transition-all"
            />
          </div>

          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 outline-none rounded-xl pl-12 pr-4 py-4 text-sm transition-all"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 outline-none rounded-xl pl-12 pr-4 py-4 text-sm transition-all"
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff4040] hover:bg-red-600 active:scale-[0.98] text-white py-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-white/5"></div>
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">OR</span>
          <div className="flex-1 h-px bg-white/5"></div>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 py-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3 text-gray-300 hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <p className="text-center text-xs text-gray-600 mt-10">
          Already have an account? <Link href="/" className="text-red-500 font-bold hover:text-red-400 transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
