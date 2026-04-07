"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("bdj_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (choice: "accepted" | "declined") => {
    localStorage.setItem("bdj_cookie_consent", choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md bg-[#161616] border border-white/10 rounded-[2rem] p-6 shadow-2xl z-[100] animate-in slide-in-from-bottom-10 duration-700">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-2xl text-primary shrink-0">
          <Cookie size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Cookie Policy</h3>
            <button onClick={() => setIsVisible(false)} className="text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed mb-6 font-medium">
            {t.cookieBanner.message}{" "}
            <Link href="/privacy" className="text-primary hover:underline font-bold">
              {t.cookieBanner.learnMore}
            </Link>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleConsent("accepted")}
              className="flex-1 bg-primary hover:bg-primary/80 text-white py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
            >
              {t.cookieBanner.accept}
            </button>
            <button
              onClick={() => handleConsent("declined")}
              className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
            >
              {t.cookieBanner.decline}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
