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
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BDJ Karukera | Students Association",
  description: "Play, Compete, Dominate. Your school's go-to gaming association center.",
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
