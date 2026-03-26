"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const ADMIN_EMAIL = "admin@bdj-karukera.com";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isIceTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isAdmin = user?.email === "admin@bdj-karukera.com";

  const navLinks = [
    { name: t.nav.homepage, href: "/" },
    { name: t.nav.membership, href: "/membership" },
    { name: t.nav.games, href: "/games" },
    { name: t.nav.community, href: "/community" },
    ...(user ? [{ name: "DASHBOARD", href: "/dashboard" }] : []),
    ...(isAdmin ? [{ name: "OPERATIONS", href: "/operations" }] : [])
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-white/5 transition-all duration-500 relative">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto relative z-[60]">
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
            <span className="text-primary font-black tracking-tighter text-base uppercase hidden xs:block transition-colors duration-500">
              BDJ KARUKERA
            </span>
          </Link>

          {/* Desktop Links */}
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

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 mr-1 sm:mr-2">
              <ThemeToggle />
              <button 
                onClick={() => setLanguage(language === "EN" ? "FR" : "EN")}
                className="text-[12px] font-black tracking-widest text-primary hover:opacity-80 transition-colors"
              >
                {language === "EN" ? "FR" : "EN"}
              </button>
            </div>

            <div className="flex items-center">
              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => router.push('/register')}
                  className="bg-primary hover:opacity-80 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest transition-all duration-500 shadow-[var(--shadow-primary)] whitespace-nowrap"
                >
                  {t.nav.joinNow}
                </button>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-primary p-2 -mr-2 transition-transform active:scale-90"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <div 
          className={`lg:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-2xl transition-all duration-500 ease-in-out z-50 border-b border-white/10 overflow-y-auto ${
            isMenuOpen ? "max-h-[calc(100vh-80px)] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`text-base font-black tracking-tighter uppercase transition-colors py-3 flex items-center min-h-[48px] ${
                  pathname === link.href ? "text-primary" : "text-white/40 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-4 pb-8">
              {!user ? (
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all"
                >
                  {t.auth.signIn}
                </button>
              ) : (
                <button
                  onClick={() => signOut()}
                  className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all"
                >
                  {t.auth.logout}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
