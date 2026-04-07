import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "View your BDJ activity points, registered gaming sessions, and your digital member card. Your personal hub at Paris School of Business.",
  alternates: { canonical: "https://bdj-karukera.vercel.app/dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
