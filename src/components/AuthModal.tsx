"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { X, Mail, Lock, Loader2, LogIn } from "lucide-react";

// ─── Friendly error messages ──────────────────────────────────────────────────
const friendlyError = (code: string): string => {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/user-not-found":
      return "No account found with this email. Sign up instead?";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    default:
      return "Something went wrong. Please try again.";
  }
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface AuthModalProps {
  onClose: () => void;
  /** Called after a successful login/signup — parent can use this to set state */
  onSuccess?: () => void;
  /** If true the modal starts in "Sign Up" mode */
  defaultSignUp?: boolean;
  /** Redirect path after success (defaults to /planning) */
  redirectTo?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuthModal({
  onClose,
  onSuccess,
  defaultSignUp = false,
  redirectTo = "/planning",
}: AuthModalProps) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
    router.push(redirectTo);
  };

  // ── Email / Password ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create Firestore profile
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          uid: user.uid,
          createdAt: serverTimestamp(),
          role: "member",
          gamerTag: email.split("@")[0], // Default gamer tag from email
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      handleSuccess();
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

  // ── Google Sign-In ───────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Sync profile if new
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          uid: user.uid,
          createdAt: serverTimestamp(),
          role: "member",
          gamerTag: user.displayName || "Gamer-" + user.uid.slice(0, 4),
        });
      }

      handleSuccess();
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(friendlyError(err.code));
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-[#FF5F5F]/25 rounded-3xl p-10 shadow-[0_0_80px_-20px_#FF5F5F33]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-white/30 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FF5F5F]/15 border border-[#FF5F5F]/30 flex items-center justify-center mx-auto mb-4">
            <LogIn size={24} className="text-[#FF5F5F]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">
            {isSignUp ? "JOIN THE ARENA" : "WELCOME BACK"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isSignUp ? "Create your BDJ account" : "Sign in to your BDJ account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-[#FF5F5F]/60 outline-none text-white placeholder-gray-600 rounded-xl pl-11 pr-4 py-3.5 text-sm transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="password"
              placeholder={isSignUp ? "Password (min. 6 characters)" : "Password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-[#FF5F5F]/60 outline-none text-white placeholder-gray-600 rounded-xl pl-11 pr-4 py-3.5 text-sm transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[#FF5F5F] text-xs font-medium bg-[#FF5F5F]/10 border border-[#FF5F5F]/20 rounded-xl px-4 py-3 leading-relaxed">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF5F5F] hover:bg-[#ff4040] disabled:opacity-50 text-white py-4 rounded-full text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_20px_-5px_#FF5F5F] flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isSignUp ? (
              "CREATE ACCOUNT"
            ) : (
              "SIGN IN"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-gray-600 text-xs font-bold tracking-widest">OR</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 disabled:opacity-50 text-white py-3.5 rounded-full text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3"
        >
          {googleLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              {/* Google "G" icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              CONTINUE WITH GOOGLE
            </>
          )}
        </button>

        {/* Toggle sign in / sign up */}
        <p className="text-center text-gray-600 text-xs mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-[#FF5F5F] hover:text-red-400 font-bold transition-colors"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
