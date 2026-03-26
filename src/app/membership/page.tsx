"use client";

import AuthCTAButton from "@/components/AuthCTAButton";
import { GraduationCap, Share2, Eye } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

export default function MembershipPage() {
  const { t, language } = useLanguage();
  const { isIceTheme } = useTheme();

  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-primary/30 pb-20">
      
      {/* ── Hero Section ── */}
      <section className="relative w-full flex flex-col items-center justify-center pt-32 pb-24 text-center px-6 overflow-hidden">
        {/* Background ambient glow matching screenshot */}
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${isIceTheme ? 'bg-cyan-500/10' : 'bg-red-500/10'} blur-[150px] rounded-full pointer-events-none`}></div>
        <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] ${isIceTheme ? 'bg-cyan-900/5' : 'bg-red-900/5'} blur-[150px] rounded-full pointer-events-none`}></div>
        
        <h1 className="font-black tracking-tighter text-white uppercase leading-[0.9] z-10 drop-shadow-lg" style={{ fontSize: 'clamp(2.5rem, 10vw, 6rem)' }}>
          {t.membership.heroTitle}
        </h1>
        <p className="mt-6 text-gray-400 max-w-lg mx-auto text-base md:text-lg leading-relaxed z-10">
          {language === "FR"
            ? "Rejoignez l'association BDJ Karukera. Adhésion gratuite, ouverte à tous les étudiants et collaborateurs."
            : "Join the BDJ Karukera association. Free membership, open to all students and collaborators."}
        </p>
        <div className="mt-10 z-10">
          <AuthCTAButton 
            primaryText={t.membership.joinNow}
            secondaryText="GO TO DASHBOARD"
            className="bg-primary hover:bg-primary/80 text-white px-10 py-4 rounded-full text-[13px] font-black tracking-widest transition-all duration-500 shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary)] uppercase"
          />
        </div>
      </section>

      {/* ── Who Can Join Section ── */}
      <section className="max-w-7xl mx-auto w-full px-6 py-16 z-10">
        <div className="mb-10 px-4 md:px-0">
          <h2 className="font-black tracking-tighter text-white uppercase inline-block border-b-2 border-primary/50 pb-2" style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)' }}>
            {t.membership.whoCanJoin}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <GraduationCap size={120} className="absolute -right-6 -top-6 text-white/[0.02] group-hover:text-white/[0.05] transition-colors" strokeWidth={1} />
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-2">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase mb-3">{t.membership.studentsTitle}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t.membership.studentsDesc}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <Share2 size={120} className="absolute -right-6 -top-6 text-white/[0.02] group-hover:text-white/[0.05] transition-colors" strokeWidth={1} />
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-2">
              <Share2 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase mb-3">{t.membership.collaboratorsTitle}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t.membership.collaboratorsDesc}
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <Eye size={120} className="absolute -right-6 -top-6 text-white/[0.02] group-hover:text-white/[0.05] transition-colors" strokeWidth={1} />
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-2">
              <Eye size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase mb-3">{t.membership.potentialTitle}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t.membership.potentialDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Rules Section ── */}
      <section className="max-w-5xl mx-auto w-full px-6 py-12 md:py-20 z-10 text-center">
        <h2 className="font-black tracking-tighter text-white uppercase mb-4" style={{ fontSize: 'clamp(1.8rem, 6vw, 3.5rem)' }}>{t.membership.theRules}</h2>
        <p className="text-gray-400 text-sm md:text-base mb-10 md:mb-12 px-4">
          By joining BDJ Karukera, you agree to the following guidelines.
        </p>

        <div className="bg-gradient-to-b from-[#1c1a1a] to-[#121212] border border-white/5 rounded-[2.5rem] p-10 md:p-16 text-left shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            
            {[
              { num: "01", text: t.membership.rule1Desc },
              { num: "02", text: t.membership.rule2Desc },
              { num: "03", text: t.membership.rule3Desc },
              { num: "04", text: t.membership.rule4Desc },
              { num: "05", text: t.membership.rule5Desc },
              { num: "06", text: t.membership.rule6Desc },
            ].map((rule) => (
              <div key={rule.num} className="flex gap-4 items-start">
                <span className="text-primary/60 font-black text-xl tracking-tighter">{rule.num}</span>
                <p className="text-sm text-gray-300 font-medium leading-relaxed pt-1">{rule.text}</p>
              </div>
            ))}
            
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-12 md:pb-20 z-10 mt-6 md:mt-10">
        <div className={`bg-gradient-to-b ${isIceTheme ? 'from-[#0f172a] to-[#020617]' : 'from-[#1a1212] to-[#140e0e]'} border border-primary/10 rounded-[2rem] md:rounded-[3rem] p-10 md:p-24 text-center shadow-[var(--shadow-primary)] relative overflow-hidden`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="bg-[var(--primary)]/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--primary)]/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              {t.membership.liveCommunity}
            </span>
            
            <h2 className="font-black tracking-tighter text-white uppercase" style={{ fontSize: 'clamp(1.8rem, 8vw, 4rem)' }}>
              {t.membership.readyToJoin}
            </h2>
            
            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto mb-2 md:mb-4">
              Membership is completely free. Join 25+ students already part of the association.
            </p>
            
            <AuthCTAButton 
              primaryText={t.membership.becomeMemberCTA}
              secondaryText="VIEW YOUR PROFILE"
              className="bg-primary hover:bg-primary/80 text-white px-8 py-4 md:px-10 md:py-5 rounded-full text-[11px] md:text-[13px] font-black tracking-widest uppercase shadow-[var(--shadow-primary)] transition-all duration-500"
            />
          </div>
        </div>
      </section>

    </div>
  );
}
