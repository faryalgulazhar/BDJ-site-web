import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col font-sans selection:bg-red-500/30">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 w-full max-w-7xl mx-auto border-b border-white/5 md:border-transparent">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="Bureau des Jeux Logo"
            width={48} 
            height={48} 
            className="object-contain"
          />
          <span className="text-red-500 font-black tracking-tighter text-lg uppercase hidden sm:block">BDJ KARUKERA</span>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-[13px] font-bold tracking-[0.15em] text-gray-400">
          <Link href="/homepage" className="text-white border-b-2 border-red-500 pb-1">HOMEPAGE</Link>
          <Link href="/games" className="hover:text-white transition-colors">GAMES</Link>
          <Link href="/membership" className="hover:text-white transition-colors">MEMBERSHIP</Link>
          <Link href="/community" className="hover:text-white transition-colors">COMMUNITY</Link>
        </div>

        <div className="flex items-center gap-6 text-[13px] font-bold tracking-[0.1em] text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:block hover:text-white transition-colors cursor-pointer">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
          <span className="hidden sm:block hover:text-white cursor-pointer transition-colors pt-0.5">FR/EN</span>
          <button className="bg-[#ff4040] hover:bg-red-600 text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all">JOIN NOW</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center pt-24 pb-32 text-center px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <p className="text-[#c79a63] text-xs font-bold tracking-[0.2em] uppercase mb-8 z-10">STUDENT ASSOCIATION - SINCE 2023</p>
        
        <h1 className="text-7xl md:text-[8rem] font-black leading-[0.85] tracking-tighter z-10">
          PLAY<br/>
          <span className="text-[#ff4040]">COMPETE</span><br/>
          DOMINATE
        </h1>
        
        <p className="mt-10 text-gray-400 max-w-xl mx-auto text-base md:text-lg leading-relaxed z-10">
          Your school's go-to association. Fifa, board games,
          console sessions and more casual or competitive,
          everyone's welcome.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 z-10 w-full sm:w-auto">
          <Link href="/homepage" className="w-full sm:w-auto">
             <button className="w-full sm:w-auto bg-[#ff4040] hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest transition-all shadow-[0_0_30px_-5px_#ff4040]">
               JOIN THE CLUB
             </button>
          </Link>
          <button className="w-full sm:w-auto bg-transparent border border-white/10 hover:border-white/30 hover:bg-white/5 text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest transition-all flex items-center justify-center gap-2">
            EXPLORE GAMES <span className="text-lg leading-none">&darr;</span>
          </button>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6 w-full object-contain">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white uppercase">OUR ECOSYSTEM</h2>
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
              <img 
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                alt="Esports Room" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/40 to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <span className="bg-[#ff4040] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">TOURNAMENT</span>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">COMPETITIVE LEAGUES</h3>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Community Mixers */}
              <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-white/5 rounded-[2rem] p-10 hover:border-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff4040] mb-6">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h4 className="text-sm font-black text-white tracking-widest uppercase mb-3">COMMUNITY MIXERS</h4>
                <p className="text-gray-500 text-sm leading-relaxed">Networking events and social gatherings for all majors.</p>
              </div>
              
              {/* Member Perks */}
              <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-white/5 rounded-[2rem] p-10 hover:border-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff4040] mb-6">
                  <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
                <h4 className="text-sm font-black text-white tracking-widest uppercase mb-3">MEMBER PERKS</h4>
                <p className="text-gray-500 text-sm leading-relaxed">Access to PlayStations, Nintendo Switches, or Karoke when you contact the association.</p>
              </div>
            </div>
          </div>

          {/* Right Column (Tabletop Nights) */}
          <div className="w-full lg:w-[350px] bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-white/5 rounded-[2rem] p-10 flex flex-col justify-start hover:border-white/10 transition-colors h-full min-h-[400px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-6">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/>
            </svg>
            <h4 className="text-sm font-black text-white tracking-widest uppercase mb-3">TABLETOP NIGHTS</h4>
            <p className="text-gray-500 text-sm leading-relaxed">Strategy, roleplay, and classic board games every Wednesday.</p>
          </div>
        </div>
      </section>

      {/* Ready To Level Up Section */}
      <section className="w-full max-w-[1000px] mx-auto px-6 py-20 mb-10 relative z-10">
        <div className="bg-gradient-to-b from-[#1c1a1a] to-[#121212] rounded-[2.5rem] border border-white/5 p-16 md:p-24 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[150px] bg-red-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 text-white uppercase">READY TO LEVEL UP?</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-10 text-sm md:text-base leading-relaxed">
            Join 25+ students already dominating the campus scene. Membership is free.
          </p>
          <button className="bg-[#ff4040] hover:bg-red-600 text-white px-10 py-5 rounded-full font-bold text-sm tracking-widest transition-all shadow-[0_4px_20px_-5px_#ff4040]">
            BECOME A MEMBER
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#0a0a0a] py-10 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-600 font-bold tracking-[0.15em] gap-6">
          <div className="flex items-center gap-2">
             <span className="text-[#ff4040] font-black tracking-tighter uppercase whitespace-nowrap text-sm">BDJ KARUKERA</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
             <Link href="#" className="hover:text-gray-300 transition-colors">PRIVACY POLICY</Link>
             <Link href="#" className="hover:text-gray-300 transition-colors">TERMS OF SERVICE</Link>
             <Link href="#" className="hover:text-gray-300 transition-colors">CONTACT US</Link>
             <Link href="#" className="hover:text-gray-300 transition-colors">SUPPORT</Link>
          </div>
          <div className="whitespace-nowrap">
             &copy; 2025 BDJ KARUKERA. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
