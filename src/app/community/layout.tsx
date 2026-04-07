import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Feed",
  description:
    "Share updates, photos, and discussions with fellow BDJ members at Paris School of Business. Stay connected with the campus gaming community.",
  alternates: { canonical: "https://bdj-karukera.vercel.app/community" },
  openGraph: {
    title: "Community | BDJ – PSB Paris",
    description:
      "Connect with BDJ members, share gaming highlights and join the conversation.",
    url: "https://bdj-karukera.vercel.app/community",
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
