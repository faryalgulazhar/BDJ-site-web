import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your free BDJ account and join the gaming and esports community at Paris School of Business. Open to all PSB students and collaborators.",
  alternates: { canonical: "https://bdj-karukera.vercel.app/register" },
  openGraph: {
    title: "Create Account | BDJ – PSB Paris",
    description: "Register for free and join the BDJ community at PSB Paris.",
    url: "https://bdj-karukera.vercel.app/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
