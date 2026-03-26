"use client";

import Image from "next/image";
import Link from "next/link";
import AuthCTAButton from "@/components/AuthCTAButton";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-[#FF5F5F]/30">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center pt-32 pb-32 text-center px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF5F5F]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <p className="text-[#c79a63] text-xs font-bold tracking-[0.2em] uppercase mb-8 z-10">{t.home.tagline}</p>
        
        <h1 className="text-7xl md:text-[8rem] font-black leading-[0.85] tracking-tighter z-10">
          PLAY<br/>
          <span className="text-[#FF5F5F]">{t.home.heroCompeteRed}</span><br/>
          {t.home.heroDominate}
        </h1>
        
        <p className="mt-10 text-gray-400 max-w-xl mx-auto text-base md:text-lg leading-relaxed z-10 whitespace-pre-wrap">
          {t.home.heroDesc}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 z-10 w-full sm:w-auto">
          <AuthCTAButton 
            primaryText={t.home.joinClub}
            secondaryText="GO TO DASHBOARD"
            className="w-full sm:w-auto bg-[#FF5F5F] hover:bg-[#ff4040] active:scale-95 text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest transition-all duration-300 shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F]"
          />
          <Link href="/games" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-transparent border border-white/10 hover:border-white/30 hover:bg-white/5 active:scale-95 text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest transition-all duration-300 flex items-center justify-center gap-2">
              {t.home.exploreGames} <span className="text-lg leading-none">&darr;</span>
            </button>
          </Link>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6 w-full object-contain">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white uppercase">{t.home.ecosystemObj}</h2>
            <p className="text-gray-400 max-w-lg text-sm md:text-base leading-relaxed">
              From the intensity of eSports arenas to the strategy of board game nights, we've built a home for every player.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/5 px-4 py-2 rounded-full shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-widest text-gray-300">LIVE SESSION</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column (Images & small cards) */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Big Competitive Leagues */}
            <div className="relative h-[300px] md:h-[450px] rounded-[2rem] overflow-hidden group border border-white/5">
              <Image 
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
                width={800}
                height={600}
                priority
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                alt="Esports Room" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/40 to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <span className="bg-[#FF5F5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">{t.home.tournamentsBadge}</span>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">{t.home.compLeagues}</h3>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Community Mixers */}
              <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-white/5 rounded-[2rem] p-10 hover:border-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF5F5F] mb-6">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h4 className="text-sm font-black text-white tracking-widest uppercase mb-3">{t.home.communityMixers}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">Networking events and social gatherings for all majors.</p>
              </div>
              
              {/* Member Perks */}
              <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-white/5 rounded-[2rem] p-10 hover:border-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF5F5F] mb-6">
                  <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
                <h4 className="text-sm font-black text-white tracking-widest uppercase mb-3">{t.home.memberPerks}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">Access to PlayStations, Nintendo Switches, or Karoke when you contact the association.</p>
              </div>
            </div>
          </div>

          {/* Right Column (Tabletop Nights) */}
          <div className="w-full lg:w-[350px] bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-white/5 rounded-[2rem] p-10 flex flex-col justify-start hover:border-white/10 transition-colors h-full min-h-[400px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-6">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/>
            </svg>
            <h4 className="text-sm font-black text-white tracking-widest uppercase mb-3">{t.home.tabletopNights}</h4>
            <p className="text-gray-500 text-sm leading-relaxed">Strategy, roleplay, and classic board games every Wednesday.</p>
          </div>
        </div>
      </section>

      {/* Ready To Level Up Section */}
      <section className="w-full max-w-[1000px] mx-auto px-6 py-20 mb-10 relative z-10">
        <div className="bg-gradient-to-b from-[#1c1a1a] to-[#121212] rounded-[2.5rem] border border-white/5 p-16 md:p-24 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[150px] bg-[#FF5F5F]/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 text-white uppercase">{t.home.readyToLevelUp}</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-10 text-sm md:text-base leading-relaxed">
            {t.home.readyDesc}
          </p>
          <AuthCTAButton 
            primaryText={t.home.becomeMember}
            secondaryText="VIEW YOUR PERKS"
            className="bg-[#FF5F5F] hover:bg-[#ff4040] active:scale-95 text-white px-10 py-5 rounded-full font-bold text-sm tracking-widest transition-all duration-300 shadow-[0_4px_20px_-5px_#FF5F5F] hover:shadow-[0_8px_30px_-5px_#FF5F5F]"
          />
        </div>
      </section>

    </div>
  );
}
