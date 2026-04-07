"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col min-h-screen pt-32 pb-20 px-6 selection:bg-primary/30">
      <div className="max-w-4xl mx-auto w-full">
        
        <header className="mb-16">
          <div className="flex items-center gap-4 text-primary mb-4">
            <ShieldCheck size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t.footer.privacy}</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-6">
            {t.privacyPolicy.title}
          </h1>
          <div className="h-1 w-20 bg-primary mb-8" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
          
          <section className="space-y-4">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.privacyPolicy.dataTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.privacyPolicy.dataText}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.privacyPolicy.purposeTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.privacyPolicy.purposeText}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.privacyPolicy.storageTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.privacyPolicy.storageText}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.privacyPolicy.rightsTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.privacyPolicy.rightsText}
            </p>
          </section>

          <section className="space-y-4 col-span-full pt-8 border-t border-white/5">
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">{t.privacyPolicy.cookiesTitle}</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {t.privacyPolicy.cookiesText}
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
