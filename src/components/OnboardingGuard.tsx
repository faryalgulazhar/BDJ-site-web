"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Routes that don't require onboarding to be complete.
// /onboarding itself is excluded to prevent redirect loops.
// /login and /register are excluded so unauthenticated users aren't redirected.
const ONBOARDING_EXEMPT = ["/onboarding", "/login", "/register", "/terms", "/privacy", "/legal"];

/**
 * Wraps the entire app (inside AuthProvider) and redirects authenticated
 * users who haven't completed onboarding to /onboarding.
 */
export default function OnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, profileLoading, onboardingComplete, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until auth and profile are both resolved
    if (loading || profileLoading) return;
    // No user → nothing to guard
    if (!user) return;
    // Admins bypass onboarding
    if (isAdmin) return;
    // Already exempt
    if (ONBOARDING_EXEMPT.some((p) => pathname.startsWith(p))) return;
    // Needs onboarding
    if (!onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [user, loading, profileLoading, onboardingComplete, isAdmin, pathname, router]);

  return <>{children}</>;
}
