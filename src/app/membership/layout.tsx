import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Join BDJ, the official student gaming and esports association of Paris School of Business. Free membership open to all PSB students and collaborators.",
  alternates: { canonical: "https://bdj-karukera.vercel.app/membership" },
  openGraph: {
    title: "Join BDJ | Paris School of Business",
    description:
      "Become a member of BDJ — free, open to all PSB students. Compete, connect, and level up.",
    url: "https://bdj-karukera.vercel.app/membership",
  },
};

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
