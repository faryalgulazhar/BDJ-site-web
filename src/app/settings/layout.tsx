import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your BDJ profile, gamer tag, avatar, and account security settings.",
  alternates: { canonical: "https://bdj-karukera.vercel.app/settings" },
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
