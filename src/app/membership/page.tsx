import AuthCTAButton from "@/components/AuthCTAButton";
import { GraduationCap, Share2, Eye } from "lucide-react";

export default function MembershipPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-[#FF5F5F]/30 pb-20">
      
      {/* ── Hero Section ── */}
      <section className="relative w-full flex flex-col items-center justify-center pt-28 pb-24 text-center px-6 overflow-hidden">
        {/* Background ambient glow matching screenshot */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-900/5 blur-[150px] rounded-full pointer-events-none"></div>
        
        <h1 className="text-6xl md:text-[6rem] font-black tracking-tighter text-white uppercase leading-[0.9] z-10 drop-shadow-lg">
          BECOME A <span className="text-[#ffdbdb] drop-shadow-[0_0_20px_rgba(255,95,95,0.3)]">MEMBER</span>
        </h1>
        <p className="mt-6 text-gray-400 max-w-lg mx-auto text-base md:text-lg leading-relaxed z-10">
          Join the BDJ Karukera association. Free membership, open to all students and collaborators.
        </p>
        <div className="mt-10 z-10">
          <AuthCTAButton 
            primaryText="JOIN NOW"
            secondaryText="GO TO DASHBOARD"
            className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-10 py-4 rounded-full text-[13px] font-black tracking-widest transition-all duration-300 shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F] uppercase"
          />
        </div>
      </section>

      {/* ── Who Can Join Section ── */}
      <section className="max-w-7xl mx-auto w-full px-6 py-16 z-10">
        <div className="mb-10">
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase inline-block border-b-2 border-[#FF5F5F]/50 pb-2">
            WHO CAN JOIN
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden group hover:border-[#FF5F5F]/30 transition-colors">
            <GraduationCap size={120} className="absolute -right-6 -top-6 text-white/[0.02] group-hover:text-white/[0.05] transition-colors" strokeWidth={1} />
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-2">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase mb-3">STUDENTS</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Access to all gaming sessions, tournaments, and community events on campus.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden group hover:border-[#FF5F5F]/30 transition-colors">
            <Share2 size={120} className="absolute -right-6 -top-6 text-white/[0.02] group-hover:text-white/[0.05] transition-colors" strokeWidth={1} />
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-2">
              <Share2 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase mb-3">COLLABORATORS</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Engage with the community, host sessions, and support the association's growth.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden group hover:border-[#FF5F5F]/30 transition-colors">
            <Eye size={120} className="absolute -right-6 -top-6 text-white/[0.02] group-hover:text-white/[0.05] transition-colors" strokeWidth={1} />
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-2">
              <Eye size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase mb-3">POTENTIAL MEMBERS</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Curious about the club? Join as a guest to stay updated on our next open events.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Rules Section ── */}
      <section className="max-w-5xl mx-auto w-full px-6 py-20 z-10 text-center">
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase mb-4">THE RULES</h2>
        <p className="text-gray-400 text-sm md:text-base mb-12">
          By joining BDJ Karukera, you agree to the following guidelines.
        </p>

        <div className="bg-gradient-to-b from-[#1c1a1a] to-[#121212] border border-white/5 rounded-[2.5rem] p-10 md:p-16 text-left shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            
            {[
              { num: "01", text: "Respect all members and collaborators at all times." },
              { num: "02", text: "Fair play is mandatory in all game sessions and tournaments." },
              { num: "03", text: "No harassment, discrimination or offensive language." },
              { num: "04", text: "Event registrations must be cancelled 24h in advance if unable to attend." },
              { num: "05", text: "Community posts must remain constructive and relevant." },
              { num: "06", text: "Board decisions are final and must be respected." },
            ].map((rule) => (
              <div key={rule.num} className="flex gap-4 items-start">
                <span className="text-[#FF5F5F]/60 font-black text-xl tracking-tighter">{rule.num}</span>
                <p className="text-sm text-gray-300 font-medium leading-relaxed pt-1">{rule.text}</p>
              </div>
            ))}
            
            {/* Rule 07 spans full width loosely based on screenshot, or just fits naturally */}
            <div className="flex gap-4 items-start md:col-span-2">
              <span className="text-[#FF5F5F]/60 font-black text-xl tracking-tighter">07</span>
              <p className="text-sm text-gray-300 font-medium leading-relaxed pt-1">
                Any violation may result in suspension from the association.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-20 z-10 mt-10">
        <div className="bg-gradient-to-b from-[#1a1212] to-[#140e0e] border border-[#FF5F5F]/10 rounded-[3rem] p-16 md:p-24 text-center shadow-[0_0_50px_-20px_#ff404022] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#FF5F5F]/5 blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="bg-[#ff4040]/10 text-[#FF5F5F] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#ff4040]/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F5F] animate-pulse"></span>
              LIVE COMMUNITY
            </span>
            
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">
              READY TO JOIN?
            </h2>
            
            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto mb-4">
              Membership is completely free. Join 25+ students already part of the association.
            </p>
            
            <AuthCTAButton 
              primaryText="BECOME A MEMBER"
              secondaryText="VIEW YOUR PROFILE"
              className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-10 py-5 rounded-full text-[13px] font-black tracking-widest uppercase shadow-[0_0_30px_-5px_#FF5F5F] transition-all duration-300"
            />
          </div>
        </div>
      </section>

    </div>
  );
}
