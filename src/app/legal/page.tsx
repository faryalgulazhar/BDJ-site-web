"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Scale } from "lucide-react";

export default function LegalNoticePage() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col min-h-screen pt-32 pb-20 px-6 selection:bg-primary/30">
      <div className="max-w-4xl mx-auto w-full">
        
        <header className="mb-16">
          <div className="flex items-center gap-4 text-primary mb-4">
            <Scale size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t.footer.legal}</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-6">
            {t.legalNotice.title}
          </h1>
          <div className="h-1 w-20 bg-primary mb-8" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <section className="space-y-4">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.legalNotice.publisherTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.legalNotice.publisherText}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.legalNotice.hostingTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.legalNotice.hostingText}
            </p>
          </section>

          <section className="space-y-4 col-span-full pt-8 border-t border-white/5">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.legalNotice.contactTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.legalNotice.contactText}
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
