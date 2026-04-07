"use client";

import { useLanguage } from "@/context/LanguageContext";
import { FileText } from "lucide-react";

export default function TermsOfUsePage() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col min-h-screen pt-32 pb-20 px-6 selection:bg-primary/30">
      <div className="max-w-4xl mx-auto w-full">
        
        <header className="mb-16">
          <div className="flex items-center gap-4 text-primary mb-4">
            <FileText size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t.footer.terms}</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-6">
            {t.termsOfUse.title}
          </h1>
          <div className="h-1 w-20 bg-primary mb-8" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
          
          <section className="space-y-4">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.termsOfUse.eligibilityTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.termsOfUse.eligibilityText}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.termsOfUse.accountsTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.termsOfUse.accountsText}
            </p>
          </section>

          <section className="space-y-4 border-t border-white/5 pt-8">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.termsOfUse.qrTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.termsOfUse.qrText}
            </p>
          </section>

          <section className="space-y-4 border-t border-white/5 pt-8">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.termsOfUse.liabilityTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.termsOfUse.liabilityText}
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
