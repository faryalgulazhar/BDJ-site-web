import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import PageTransition from "@/components/PageTransition";
import CustomCursor from "@/components/CustomCursor";
import TopLoader from "@/components/TopLoader";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://bdj-karukera.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "BDJ | Paris School of Business",
    template: "%s | BDJ – PSB Paris",
  },
  description:
    "BDJ (Bureau Des Jeux) is the official gaming and esports student association of Paris School of Business. Compete, connect and level up with your campus community.",
  keywords: [
    "BDJ", "Bureau Des Jeux", "Paris School of Business", "PSB Paris",
    "gaming association", "esports", "student club", "jeux vidéo", "tournoi"
  ],
  authors: [{ name: "BDJ – Paris School of Business", url: "https://www.psbedu.paris/fr" }],
  creator: "BDJ Karukera",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: BASE_URL,
    siteName: "BDJ | Paris School of Business",
    title: "BDJ | Paris School of Business – Gaming & Esports Association",
    description:
      "BDJ (Bureau Des Jeux) is the official gaming and esports student association of Paris School of Business. Compete, connect and level up with your campus community.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BDJ – Paris School of Business Gaming Association",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BDJ | Paris School of Business",
    description:
      "Official gaming & esports club of Paris School of Business. Tournaments, sessions and more.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] selection:bg-primary/30 lg:cursor-none">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
            <TopLoader />
            <CustomCursor />
            <EmailVerificationBanner />
            <Navbar />
            <main className="flex-1 flex flex-col min-h-screen">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <Footer />
              <Toaster position="bottom-right" theme="dark" richColors />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
