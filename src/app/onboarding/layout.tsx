import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to BDJ | Complete Your Profile",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Intentionally minimal — no Navbar, Footer, or other chrome.
  // This prevents users from navigating away before completing onboarding.
  return <>{children}</>;
}
