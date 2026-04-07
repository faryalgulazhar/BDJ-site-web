import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your BDJ account to access gaming sessions, the community feed, and your member dashboard at Paris School of Business.",
  alternates: { canonical: "https://bdj-karukera.vercel.app/login" },
  openGraph: {
    title: "Sign In | BDJ – PSB Paris",
    description: "Access your BDJ member account.",
    url: "https://bdj-karukera.vercel.app/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
