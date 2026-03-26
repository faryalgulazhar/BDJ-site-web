"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";

const ADMIN_EMAIL = "admin@bdj-karukera.com";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isIceTheme } = useTheme();

  const isAdmin = user?.email === "admin@bdj-karukera.com";

  const navLinks = [
    { name: t.nav.homepage, href: "/" },
    { name: t.nav.games, href: "/games" },
    { name: t.nav.membership, href: "/membership" },
    { name: t.nav.community, href: "/community" },
    ...(isAdmin ? [{ name: "OPERATIONS", href: "/operations" }] : [])
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-white/5 transition-all duration-500">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <Image 
                src="/logo_red.png" 
                alt="BDJ KARUKERA Red" 
                fill
                priority
                className={`object-contain transition-opacity duration-500 ${isIceTheme ? 'opacity-0' : 'opacity-100'}`} 
              />
              <Image 
                src="/logo_blue.png" 
                alt="BDJ KARUKERA Blue" 
                fill
                priority
                className={`object-contain transition-opacity duration-500 ${isIceTheme ? 'opacity-100' : 'opacity-0'}`} 
              />
            </div>
            <span className="text-primary font-black tracking-tighter text-base uppercase hidden sm:block transition-colors duration-500">
              BDJ KARUKERA
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-[12px] font-bold tracking-[0.15em] text-[var(--navbar-link)]">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`transition-all duration-500 relative pb-1 ${
                  pathname === link.href 
                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
                    : "hover:text-primary"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center">
              <ThemeToggle />
            </div>
            <button 
              onClick={() => setLanguage(language === "EN" ? "FR" : "EN")}
              className="hidden sm:block text-[12px] font-black tracking-widest text-primary hover:opacity-80 transition-colors"
            >
              {language === "EN" ? "FR" : "EN"}
            </button>
            {user ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => router.push('/register')}
                className="bg-primary hover:opacity-80 text-white px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all duration-500 shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary)]"
              >
                {t.nav.joinNow}
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
