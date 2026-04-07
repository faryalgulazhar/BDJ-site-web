import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gaming Sessions & Esports Events",
  description:
    "Browse, register, and compete in video game tournaments, board game sessions, and esports events organized by BDJ — the gaming association of Paris School of Business.",
  alternates: { canonical: "https://bdj-karukera.vercel.app/games" },
  openGraph: {
    title: "Gaming Sessions | BDJ – PSB Paris",
    description:
      "Upcoming video game, board game, and tournament sessions at Paris School of Business.",
    url: "https://bdj-karukera.vercel.app/games",
  },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
