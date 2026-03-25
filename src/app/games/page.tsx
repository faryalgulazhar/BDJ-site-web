"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import {
  Plus,
  Users,
  Calendar,
  Clock,
  Lock,
  Moon,
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
        className={`w-full py-3 rounded-xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
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
  const { user, loading: authLoading, signOut } = useAuth();

  const [sessions, setSessions] = useState<GameSession[]>(initialSessions);
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const isLoggedIn = !!user;

  // Filter sessions
  const filteredSessions = sessions.filter((s) =>
    activeTab === "ALL" ? true : categoryToTab[s.category] === activeTab
  );

  // Register handler
  const handleRegister = useCallback(
    (id: number) => {
      // Not logged in → show auth modal
      if (!isLoggedIn) {
        setPendingId(id);
        setShowAuthModal(true);
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
    [isLoggedIn, sessions]
  );

  // After successful auth, auto-register pending session
  const handleAuthSuccess = useCallback(() => {
    if (pendingId !== null) {
      const id = pendingId;
      setPendingId(null);
      setTimeout(() => handleRegister(id), 150);
    }
  }, [pendingId, handleRegister]);

  // Sign out
  const handleSignOut = async () => {
    await signOut();
    toast("Signed out.");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); setPendingId(null); }}
          onSuccess={handleAuthSuccess}
          redirectTo="/planning"
        />
      )}

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Bureau des Jeux" width={40} height={40} className="object-contain" />
            <span className="text-[#FF5F5F] font-black tracking-tighter text-base uppercase hidden sm:block">
              BDJ KARUKERA
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-[12px] font-bold tracking-[0.15em] text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">HOMEPAGE</Link>
            <Link href="/games" className="text-white relative pb-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#FF5F5F] after:rounded-full">
              GAMES
            </Link>
            <Link href="/membership" className="hover:text-white transition-colors">MEMBERSHIP</Link>
            <Link href="/community" className="hover:text-white transition-colors">COMMUNITY</Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex text-gray-400 hover:text-white transition-colors">
              <Moon size={18} />
            </button>
            <span className="hidden sm:block text-[12px] font-bold tracking-widest text-gray-400 hover:text-white cursor-pointer transition-colors">
              FR/EN
            </span>
            {authLoading ? (
              <div className="w-24 h-9 bg-white/5 rounded-full animate-pulse" />
            ) : isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-[11px] text-gray-400 font-medium truncate max-w-[120px]">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all"
                >
                  LOG OUT
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all shadow-[0_0_20px_-5px_#FF5F5F]"
              >
                JOIN NOW
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Login status banner ── */}
      {isLoggedIn && (
        <div className="bg-green-500/10 border-b border-green-500/20 text-green-400 text-[11px] font-bold tracking-widest text-center py-2.5 px-4">
          ✓ LOGGED IN AS {user?.email?.toUpperCase()} — You can register for sessions
        </div>
      )}

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-16 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white leading-none">GAMES</h1>
            <p className="mt-4 text-gray-400 max-w-md text-sm md:text-base leading-relaxed">
              Browse upcoming sessions and tournaments.<br />
              Register to secure your spot in our kinetic arena.
            </p>
          </div>
          <button
            onClick={() => router.push("/sessions/new")}
            className="flex items-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-6 py-4 rounded-full text-[11px] font-black tracking-widest transition-all shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F] whitespace-nowrap self-start sm:self-auto"
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
              className={`px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-200 ${
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
      <section className="max-w-7xl mx-auto w-full px-6 pb-16">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-24 text-gray-600 font-bold tracking-widest text-sm">
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
        <section className="max-w-7xl mx-auto w-full px-6 pb-20">
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
                To register for sessions and track your tournament progress, you must be part of the collective.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-8 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all shadow-[0_0_25px_-5px_#FF5F5F]"
                >
                  LOGIN TO REGISTER
                </button>
                <button
                  onClick={() => router.push("/guest-view")}
                  className="bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white/70 hover:text-white px-8 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all"
                >
                  EXPLORE AS GUEST
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-white/5 bg-[#080808] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-bold tracking-[0.15em] text-gray-600">
          <span className="text-[#FF5F5F] font-black tracking-tighter text-sm uppercase">BDJ Karukera</span>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <Link href="#" className="hover:text-gray-300 transition-colors">PRIVACY POLICY</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">TERMS OF SERVICE</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">LEGAL MENTIONS</Link>
          </div>
          <span className="whitespace-nowrap">@2025 BDJ KARUKERA. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
}
