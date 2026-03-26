"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Users, Trophy } from "lucide-react";
import CyberCalendar from "@/components/CyberCalendar";

export default function DashboardPage() {
  const { user } = useAuth();
  const { isIceTheme } = useTheme();
  const router = useRouter();

  // Auth Guard
  useEffect(() => {
    if (user === null) router.replace("/login");
  }, [user, router]);

  if (user === undefined || user === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
      <section className="max-w-7xl mx-auto w-full px-6 pt-32 pb-10">
        <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-3 transition-colors duration-500">
          YOUR SPACE
        </p>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none">
          DASHBOARD
        </h1>
        <p className="mt-4 text-gray-400 text-sm max-w-md leading-relaxed">
          Welcome back,{" "}
          <span className="text-primary font-black transition-colors duration-500">
            {user.displayName || user.email?.split("@")[0] || "Player"}
          </span>
          . Here&apos;s your hub.
        </p>
      </section>

      {/* Bento Grid */}
      <section className="max-w-7xl mx-auto w-full px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── Largest Box: Cyber Calendar (spans 2 cols on desktop) ── */}
          <div className={`${box} md:col-span-2 min-h-[520px]`}>
            <CyberCalendar />
          </div>

          {/* ── Right column: two stacked boxes ── */}
          <div className="flex flex-col gap-6">

            {/* Community */}
            <div className={`${box} flex-1`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/20 transition-colors duration-500">
                <Users size={22} className="text-primary transition-colors duration-500" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-tight">Community</h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Your posts and community activity.
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-white/5">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                  Coming soon
                </span>
              </div>
            </div>

            {/* Achievements */}
            <div className={`${box} flex-1`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/20 transition-colors duration-500">
                <Trophy size={22} className="text-primary transition-colors duration-500" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-tight">Achievements</h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Tournament results and badges.
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-white/5">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                  Coming soon
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
