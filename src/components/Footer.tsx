"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#080808] py-10 relative z-10 w-full">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-6 text-[11px] font-bold tracking-[0.15em] text-gray-600">
        
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-primary font-black tracking-tighter text-sm uppercase">BDJ Karukera</span>
            <span className="text-gray-700">·</span>
            <a
              href="https://www.psbedu.paris/fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-all duration-300 uppercase tracking-widest text-[10px]"
            >
              Paris School of Business
            </a>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <Link href="/privacy" className="hover:text-gray-300 transition-all duration-500">{t.footer.privacy}</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-all duration-500">{t.footer.terms}</Link>
            <Link href="/legal" className="hover:text-gray-300 transition-all duration-500">{t.footer.legal}</Link>
            <a href="https://www.instagram.com/bdj_psb" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-all duration-500">{t.footer.contact}</a>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 border-t border-white/5 pt-6">
          <p className="opacity-50 text-center md:text-left">&copy; 2026 BDJ KARUKERA. ALL RIGHTS RESERVED.</p>
          <a
            href="https://www.psbedu.paris/fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-600 hover:text-primary transition-colors duration-300 uppercase tracking-widest"
          >
            An association of Paris School of Business
          </a>
        </div>
      </div>
    </footer>
  );
}
