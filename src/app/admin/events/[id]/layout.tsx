import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Event Detail",
  description: "BDJ administrator event management and QR attendance scanning.",
  robots: { index: false, follow: false },
};

export default function AdminEventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
