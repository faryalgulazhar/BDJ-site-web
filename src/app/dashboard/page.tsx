"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Star, X, Calendar, Clock } from "lucide-react";
import CyberCalendar from "@/components/CyberCalendar";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MemberCard from "@/components/MemberCard";

const categoryColors: Record<string, string> = {
  "VIDEO GAME": "bg-primary/20 text-primary border border-primary/40",
  "BOARD GAME": "bg-amber-500/20 text-amber-400 border border-amber-500/40",
  "TOURNAMENT": "bg-violet-500/20 text-violet-400 border border-violet-500/40",
};

const ADMIN_EMAIL = "admin@bdj-karukera.com";

export default function DashboardPage() {
  const { user } = useAuth();
  const { isIceTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [registeredSessionIds, setRegisteredSessionIds] = useState<string[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);

  // Auth Guard
  useEffect(() => {
    if (user === null) router.replace("/login");
  }, [user, router]);

  // Points & Registrations Fetcher
  useEffect(() => {
    if (!user) return;
    
    if (isAdmin) {
      // Admin: Fetch ALL registrations
      const q = query(collection(db, "registrations"));
      const unsub = onSnapshot(q, (snap) => {
        setAllRegistrations(snap.docs.map(d => d.data()));
      });
      return () => unsub();
    } else {
      // User: Fetch ONLY their registrations
      const q = query(collection(db, "registrations"), where("userId", "==", user.uid));
      const unsub = onSnapshot(q, (snap) => {
        setRegisteredSessionIds(snap.docs.map(d => d.data().sessionId));
      });
      return () => unsub();
    }
  }, [user, isAdmin]);

  // Sessions Fetcher
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "sessions"));
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  if (user === undefined || user === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const validRegisteredSessions = sessions.filter(s => registeredSessionIds.includes(s.id));
  const computedPoints = validRegisteredSessions.length;

  // Process Leaderboard if Admin
  const leaderboardScores = useMemo(() => {
    if (!isAdmin) return [];
    
    // Filter out deleted sessions just like points
    const validSessionIds = new Set(sessions.map(s => s.id));
    const validRegs = allRegistrations.filter(r => validSessionIds.has(r.sessionId));
    
    const userM: Record<string, { tag: string; email: string; score: number }> = {};
    validRegs.forEach(r => {
      const id = r.userId;
      if (!userM[id]) {
        userM[id] = { tag: r.userGamerTag || r.userEmail?.split("@")[0] || "PLAYER", email: r.userEmail, score: 0 };
      }
      userM[id].score += 1;
    });

    return Object.values(userM).sort((a, b) => b.score - a.score); // highest score first
  }, [isAdmin, allRegistrations, sessions]);

  const topScore = leaderboardScores.length > 0 ? leaderboardScores[0].score : 0;

  const borderClass = isIceTheme
    ? "border-[#3FCEEE]/20 hover:border-[#3FCEEE]/50"
    : "border-[#FF5F5F]/20 hover:border-[#FF5F5F]/50";

  const glowClass = isIceTheme
    ? "shadow-[0_0_40px_-15px_rgba(63,206,238,0.2)]"
    : "shadow-[0_0_40px_-15px_rgba(255,95,95,0.2)]";

  const box = `bg-[#0A0E1A] border rounded-3xl p-6 flex flex-col gap-4 transition-all duration-500 ${borderClass} ${glowClass}`;

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 selection:bg-primary/30">
      {/* Header */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-24 md:pt-32 pb-8 md:pb-10">
        <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-2 md:mb-3 transition-colors duration-500">
          {t.dashboard.yourSpace}
        </p>
        <h1 className="font-black tracking-tighter text-white uppercase leading-none" style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}>
          {t.dashboard.title}
        </h1>
        <p className="mt-4 text-gray-400 text-sm max-w-md leading-relaxed">
          {t.dashboard.welcomeBack}{" "}
          <span className="text-primary font-black transition-colors duration-500">
            {user.displayName || user.email?.split("@")[0] || "Player"}
          </span>
          {t.dashboard.hub}
        </p>
      </section>

      {/* Bento Grid */}
      <section className="max-w-7xl mx-auto w-full px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── Largest Box: Cyber Calendar (spans 2 cols on desktop) ── */}
          <div className={`${box} md:col-span-2 min-h-[400px] md:min-h-[520px] overflow-hidden px-4 md:px-6`}>
            <CyberCalendar />
          </div>

          {/* ── Right column: two stacked boxes ── */}
          <div className="flex flex-col gap-6">

            {/* Points */}
            <div 
              onClick={() => setIsModalOpen(true)}
              className={`${box} flex-1 relative overflow-hidden group cursor-pointer hover:border-primary/50`}
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/20 transition-colors duration-500 relative z-10">
                <Star size={22} className="text-primary transition-colors duration-500" />
              </div>
              <div className="relative z-10">
                <h2 className="text-base font-black text-white uppercase tracking-tight">
                  {isAdmin ? t.dashboard.leaderboard : t.dashboard.activityPoints}
                </h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {isAdmin 
                    ? `${t.dashboard.leaderboardDesc} ${sessions.length} ${t.dashboard.leaderboardDescSuffix}`
                    : <>{t.dashboard.pointsDesc} <span className="text-primary font-bold transition-colors duration-500">+1 PT</span>.</>
                  }
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-white/5 flex items-end justify-between relative z-10">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest pb-1">
                  {isAdmin ? t.dashboard.topScore : t.dashboard.currentScore}
                </span>
                <span className="text-5xl font-black text-primary tracking-tighter leading-none transition-colors duration-500">
                  {isAdmin ? topScore : computedPoints}
                </span>
              </div>
            </div>

            {/* Member Card */}
            <div className={`${box} flex-1 !p-2 md:!p-4 overflow-hidden items-center justify-center`}>
              {user && <MemberCard user={user} />}
            </div>

          </div>

        </div>
      </section>

      {/* ── Registered Events Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
          <div className="bg-[#0a0e1a] border border-white/10 w-full max-w-lg rounded-2xl md:rounded-3xl p-6 md:p-10 relative shadow-2xl max-h-[85vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-colors duration-500" />
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 md:top-6 md:right-6 text-gray-400 hover:text-white transition-colors">
              <X size={22} />
            </button>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-1">
              {isAdmin ? t.dashboard.leaderboardTitle : t.dashboard.yourEvents}
            </h2>
            <p className="text-primary text-[10px] uppercase font-black tracking-widest mb-6 transition-colors duration-500">
              {isAdmin ? t.dashboard.leaderboardSub : t.dashboard.activityLog}
            </p>
            
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {isAdmin ? (
                // ADMIN LEADERBOARD VIEW
                leaderboardScores.length === 0 ? (
                  <div className="py-12 text-center text-gray-600 font-bold uppercase tracking-widest text-[10px]">
                    {t.dashboard.noMembers}
                  </div>
                ) : (
                  leaderboardScores.map((leader, i) => (
                    <div key={i} className="flex p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${i === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' : i === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/40' : i === 2 ? 'bg-orange-800/30 text-orange-600 border border-orange-800/50' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                          #{i + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white font-black text-sm uppercase tracking-tight">{leader.tag}</span>
                          <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">{leader.email}</span>
                        </div>
                      </div>
                      <span className="text-2xl font-black text-primary tracking-tighter">{leader.score}</span>
                    </div>
                  ))
                )
              ) : (
                // STANDARD USER VIEW
                validRegisteredSessions.length === 0 ? (
                  <div className="py-12 text-center text-gray-600 font-bold uppercase tracking-widest text-[10px]">
                    {t.dashboard.noEvents}
                  </div>
                ) : (
                  validRegisteredSessions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // sort newest first
                    .map((session, i) => (
                      <div key={i} className="flex p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-black tracking-widest transition-colors duration-500 ${categoryColors[session.category] || "bg-primary/20 text-primary border border-primary/20"}`}>
                            {session.category}
                          </span>
                          <span className="text-green-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
                            +1 PT
                          </span>
                        </div>
                        <h3 className="text-white font-black text-sm uppercase tracking-tight mt-1">{session.title}</h3>
                        <div className="flex items-center gap-4 text-gray-500 text-[10px] font-bold tracking-widest mt-1 uppercase">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {session.date}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {session.time}</span>
                        </div>
                      </div>
                    ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
