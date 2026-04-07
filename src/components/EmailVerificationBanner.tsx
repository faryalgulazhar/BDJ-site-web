"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // If there's no user, or they are already verified, don't show the banner
  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    if (loading || sent) return;
    setLoading(true);
    try {
      await sendEmailVerification(user);
      setSent(true);
      toast.success("Verification email sent! Check your inbox.");
    } catch (error: any) {
      if (error.code === "auth/too-many-requests") {
        toast.error("Too many requests. Please wait a bit before trying again.");
      } else {
        toast.error("Failed to resend email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 px-4 py-2 flex items-center justify-center gap-3 text-sm z-50 relative">
      <AlertTriangle size={16} />
      <span className="font-medium tracking-wide">
        Please verify your email address to unlock all features.
      </span>
      <button
        onClick={handleResend}
        disabled={loading || sent}
        className="ml-2 font-bold underline hover:text-yellow-400 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin inline" /> : sent ? "Sent!" : "Resend Email"}
      </button>
    </div>
  );
}
