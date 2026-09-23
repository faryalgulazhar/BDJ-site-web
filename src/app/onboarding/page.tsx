"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, User, Shield, ChevronRight, LogOut } from "lucide-react";
import Image from "next/image";

export default function OnboardingPage() {
  const { user, loading, profileLoading, onboardingComplete, userProfile, signOut } = useAuth();
  const router = useRouter();

  const [legalName, setLegalName] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill username from old gamerTag if it exists
  useEffect(() => {
    if (userProfile && !username) {
      const existingTag = (userProfile as any).gamerTag;
      if (existingTag) setUsername(existingTag);
    }
  }, [userProfile]);

  // Redirect away if already complete or not signed in
  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (onboardingComplete) { router.replace("/community"); return; }
  }, [user, loading, profileLoading, onboardingComplete, router]);

  const canSubmit =
    legalName.trim().length > 0 &&
    username.trim().length > 0 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit) return;

    setSubmitting(true);
    try {
      // 1. Write legalName + onboardingComplete to the private doc
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          legalName: legalName.trim(),
          onboardingComplete: true,
          isAdmin: false,
          superAdmin: false,
          role: "member",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Write username + photoURL to the public sub-doc
      await setDoc(doc(db, "users", user.uid, "public", "profile"), {
        username: username.trim(),
        photoURL: user.photoURL || null,
      });

      toast.success("Welcome to BDJ! 🎮");
      router.replace("/community");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#060912] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060912] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="relative w-10 h-10">
            <Image src="/logo_red.png" alt="BDJ" fill className="object-contain" />
          </div>
          <span className="text-primary font-black tracking-tighter text-xl uppercase">BDJ</span>
        </div>

        {/* Card */}
        <div className="bg-[#0d1117] border border-white/8 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          {/* Header */}
          <div className="mb-8">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Step 1 of 1</p>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
              Set Up Your<br />Profile
            </h1>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              Just two things before you join the community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Legal Name */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <Shield size={12} className="text-primary" />
                Full Legal Name
              </label>
              <input
                id="onboarding-legal-name"
                type="text"
                autoComplete="name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Marie Dupont"
                required
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 outline-none rounded-xl px-4 py-4 text-white text-sm transition-all"
              />
              <p className="text-[10px] text-gray-600 leading-relaxed px-1">
                Used for official attendance records only, never shown publicly.
              </p>
            </div>

            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <User size={12} className="text-primary" />
                Username
              </label>
              <input
                id="onboarding-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Nighthawk_42"
                maxLength={30}
                required
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 outline-none rounded-xl px-4 py-4 text-white text-sm transition-all"
              />
              <p className="text-[10px] text-gray-600 leading-relaxed px-1">
                This is what other members will see on the site.
              </p>
            </div>

            {/* Submit */}
            <button
              id="onboarding-submit"
              type="submit"
              disabled={!canSubmit}
              className="w-full mt-2 bg-primary hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(255,77,46,0.4)]"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Enter the Arena <ChevronRight size={14} strokeWidth={3} /></>
              )}
            </button>
          </form>
        </div>

        {/* Sign out link */}
        <button
          onClick={() => signOut()}
          className="mt-6 mx-auto flex items-center gap-2 text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-widest font-bold transition-colors"
        >
          <LogOut size={12} />
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
