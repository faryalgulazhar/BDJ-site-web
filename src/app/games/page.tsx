"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Users,
  Calendar,
  Clock,
  Lock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { GameSession, GameCategory } from "@/types/game";

// ─────────────────────────────────────────────
// Initial Mock Data
// ─────────────────────────────────────────────
const initialSessions: GameSession[] = [
  {
    id: 1,
    category: "VIDEO GAME",
    title: "TEKKEN 8 CLASH",
    date: "MAY 14, 2025",
    time: "19:00 – 22:00",
    totalSpots: 10,
    currentRegistrations: 4,
    status: "open",
  },
  {
    id: 2,
    category: "BOARD GAME",
    title: "DUNE IMPERIUM",
    date: "MAY 15, 2025",
    time: "18:30 – 23:00",
    totalSpots: 5,
    currentRegistrations: 3,
    status: "open",
  },
  {
    id: 3,
    category: "TOURNAMENT",
    title: "STREET FIGHTER VI",
    date: "MAY 12, 2025",
    time: "20:00 – 00:00",
    totalSpots: 8,
    currentRegistrations: 8,
    status: "full",
  },
  {
    id: 4,
    category: "VIDEO GAME",
    title: "EA FC 25 LEAGUE",
    date: "MAY 18, 2025",
    time: "17:00 – 20:00",
    totalSpots: 8,
    currentRegistrations: 4,
    status: "open",
  },
  {
    id: 5,
    category: "TOURNAMENT",
    title: "MARIO KART CUP",
    date: "MAY 20, 2025",
    time: "19:00 – 23:00",
    totalSpots: 16,
    currentRegistrations: 15,
    status: "open",
  },
  {
    id: 6,
    category: "BOARD GAME",
    title: "CATAN CHAMPIONSHIP",
    date: "MAY 22, 2025",
    time: "15:00 – 19:00",
    totalSpots: 6,
    currentRegistrations: 6,
    status: "full",
  },
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Tab = "ALL" | "VIDEO GAMES" | "BOARD GAMES" | "TOURNAMENTS";
const tabs: Tab[] = ["ALL", "VIDEO GAMES", "BOARD GAMES", "TOURNAMENTS"];

const categoryToTab: Record<GameCategory, Tab> = {
  "VIDEO GAME": "VIDEO GAMES",
  "BOARD GAME": "BOARD GAMES",
  TOURNAMENT: "TOURNAMENTS",
};

const categoryColors: Record<GameCategory, string> = {
  "VIDEO GAME": "bg-[#FF5F5F]/20 text-[#FF5F5F] border border-[#FF5F5F]/40",
  "BOARD GAME": "bg-amber-500/20 text-amber-400 border border-amber-500/40",
  TOURNAMENT: "bg-violet-500/20 text-violet-400 border border-violet-500/40",
};

// ─────────────────────────────────────────────
// Session Card
// ─────────────────────────────────────────────
interface CardProps {
  session: GameSession;
  isLoading: boolean;
  isLoggedIn: boolean;
  onRegister: (id: number) => void;
}

function SessionCard({ session, isLoading, isLoggedIn, onRegister }: CardProps) {
  const spotsLeft = session.totalSpots - session.currentRegistrations;
  const isFull = session.status === "full";
  const isRegistered = session.status === "registered";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 gap-5 transition-all duration-300 ${
        isFull
          ? "bg-[#0f172a]/50 border-white/5 opacity-60"
          : isRegistered
          ? "bg-[#0f172a] border-green-500/30 shadow-[0_0_30px_-10px_#22c55e]"
          : "bg-[#0f172a] border-white/10 hover:border-[#FF5F5F]/40 hover:shadow-[0_0_30px_-10px_#FF5F5F]"
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase ${categoryColors[session.category]}`}
        >
          {session.category}
        </span>
        {isFull ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-white/40">
            <Clock size={12} />
            Session Full
          </span>
        ) : isRegistered ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-green-400">
            <CheckCircle size={12} />
            Registered
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-bold text-white/60">
            <Users size={12} />
            {spotsLeft} / {session.totalSpots} spots left
          </span>
        )}
      </div>

      {/* Title & meta */}
      <div className="flex flex-col gap-2 flex-1">
        <h3 className="text-xl font-black tracking-tight text-white leading-tight">
          {session.title}
        </h3>
        <div className="flex flex-col gap-1 text-white/50 text-[13px]">
          <span className="flex items-center gap-2">
            <Calendar size={13} />
            {session.date}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={13} />
            {session.time}
          </span>
        </div>
      </div>

      {/* Register button */}
      <button
        disabled={isFull || isRegistered}
        onClick={() => onRegister(session.id)}
        className={`w-full py-3 rounded-xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
          isFull
            ? "bg-white/5 text-white/20 cursor-not-allowed"
            : isRegistered
            ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed"
            : "bg-[#FF5F5F] hover:bg-[#ff4040] text-white shadow-[0_0_20px_-5px_#FF5F5F] hover:shadow-[0_0_30px_-3px_#FF5F5F]"
        }`}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isRegistered ? (
          <>
            <CheckCircle size={14} />
            Registered
          </>
        ) : (
          "Register"
        )}
      </button>

      {/* Auth hint for guests */}
      {!isLoggedIn && !isFull && !isRegistered && (
        <p className="text-center text-[10px] text-white/20 -mt-2 font-medium">
          Login required to register
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function GamesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<GameSession[]>(initialSessions);
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const isLoggedIn = !!user;

  // Filter sessions
  const filteredSessions = sessions.filter((s) =>
    activeTab === "ALL" ? true : categoryToTab[s.category] === activeTab
  );

  // Register handler
  const handleRegister = useCallback(
    (id: number) => {
      // Not logged in → redirect to register
      if (!isLoggedIn) {
        router.push('/register');
        return;
      }

      const session = sessions.find((s) => s.id === id);
      if (!session || session.status !== "open") return;

      setLoadingId(id);

      // Simulate 500ms server delay
      setTimeout(() => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== id) return s;
            const newRegistrations = s.currentRegistrations + 1;
            return {
              ...s,
              currentRegistrations: newRegistrations,
              status: newRegistrations >= s.totalSpots ? "full" : "registered",
            };
          })
        );
        setLoadingId(null);
        toast.success(`Successfully registered for ${session.title}!`, {
          description: `${session.date} · ${session.time}`,
        });
      }, 500);
    },
    [isLoggedIn, sessions, router]
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-[#FF5F5F]/30 pb-20">
      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-16 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white leading-none uppercase">GAMES</h1>
            <p className="mt-4 text-gray-400 max-w-md text-sm md:text-base leading-relaxed">
              Browse upcoming sessions and tournaments.<br />
              Register to secure your spot in our kinetic arena.
            </p>
          </div>
          <button
            onClick={() => router.push("/sessions/new")}
            className="flex items-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-6 py-4 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F] whitespace-nowrap self-start sm:self-auto uppercase"
          >
            <Plus size={16} strokeWidth={3} />
            CREATE SESSION
          </button>
        </div>
      </section>

      {/* ── Filters ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pb-10">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 ${
                activeTab === tab
                  ? "bg-[#FF5F5F] text-white shadow-[0_0_20px_-5px_#FF5F5F]"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* ── Cards Grid ── */}
      <section className="max-w-7xl mx-auto w-full px-6">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-24 text-gray-600 font-bold tracking-widest text-sm uppercase">
            NO SESSIONS FOUND FOR THIS CATEGORY
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                isLoading={loadingId === s.id}
                isLoggedIn={isLoggedIn}
                onRegister={handleRegister}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Locked CTA (hidden when logged in) ── */}
      {!isLoggedIn && (
        <section className="max-w-7xl mx-auto w-full px-6 mt-20">
          <div className="relative rounded-3xl border border-[#FF5F5F]/20 bg-gradient-to-b from-[#1a0a0a] to-[#0f0808] p-16 md:p-24 text-center overflow-hidden shadow-[inset_0_0_80px_-20px_#FF5F5F22]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#FF5F5F]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#FF5F5F]/15 border border-[#FF5F5F]/30 flex items-center justify-center">
                <Lock size={28} className="text-[#FF5F5F]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">
                UNLOCK THE ARENA
              </h2>
              <p className="text-gray-400 max-w-sm text-sm md:text-base leading-relaxed">
                To register for sessions/track progress, you must be part of the collective.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <button
                  onClick={() => router.push("/register")}
                  className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-8 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_-5px_#FF5F5F]"
                >
                  SIGN UP TO REGISTER
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white/70 hover:text-white px-8 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300"
                >
                  LOGIN TO ACCOUNT
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
