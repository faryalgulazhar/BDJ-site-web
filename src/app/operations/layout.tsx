import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Operations",
  description: "BDJ administrator control center.",
  robots: { index: false, follow: false },
};

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
