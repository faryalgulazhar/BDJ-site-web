"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import PageTransition from "@/components/PageTransition";
import { Crown, Medal, Download, Plus, Minus, Flame, Droplet, Circle } from "lucide-react";
import { exportToExcel } from "@/lib/excel";
import { toast } from "sonner";

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
  team?: "red" | "blue";
  legalName?: string;
  email?: string;
}

export default function LeaderboardPage() {
  const { user, isAdmin } = useAuth();
  const { isIceTheme } = useTheme();
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<{ rank: number; data: LeaderboardUser } | null>(null);
  const [redPoints, setRedPoints] = useState(0);
  const [bluePoints, setBluePoints] = useState(0);
  const [allUsers, setAllUsers] = useState<LeaderboardUser[]>([]);

  // BdJ aesthetic colors
  const primaryColor = isIceTheme ? "#3FCEEE" : "#FF5F5F";
  const primaryGlow = isIceTheme ? "shadow-[0_0_30px_-10px_#3FCEEE]" : "shadow-[0_0_30px_-10px_#FF5F5F]";
  
  const teamRedColor = "bg-[#FF5F5F] text-[#FF5F5F]";
  const teamRedDot = "bg-[#FF5F5F] shadow-[0_0_10px_0px_#FF5F5F]";
  
  const teamBlueColor = "bg-[#3FCEEE] text-[#3FCEEE]";
  const teamBlueDot = "bg-[#3FCEEE] shadow-[0_0_10px_0px_#3FCEEE]";

  useEffect(() => {
    // Fetch all users to compute team points and get top 20
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const users: LeaderboardUser[] = [];
      let redTotal = 0;
      let blueTotal = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as LeaderboardUser;
        const u = { ...data, id: doc.id };
        users.push(u);

        // Sum points for teams
        if (u.team === "red") redTotal += (u.points || 0);
        if (u.team === "blue") blueTotal += (u.points || 0);
      });

      setRedPoints(redTotal);
      setBluePoints(blueTotal);
      setAllUsers(users);

      // Sort users by points DESC
      users.sort((a, b) => (b.points || 0) - (a.points || 0));

      const top20 = users.slice(0, 20);
      setTopUsers(top20);

      // Find current user rank if logged in
      if (user) {
        const userIndex = users.findIndex(u => u.id === user.uid);
        if (userIndex !== -1 && userIndex >= 20) {
           setCurrentUserRank({ rank: userIndex + 1, data: users[userIndex] });
        } else {
           setCurrentUserRank(null);
        }
      }
    });

    return () => unsub();
  }, [user?.uid]);

  const handleExport = () => {
    const rows = allUsers.map(u => ({
      Name: u.username || 'ANONYMOUS',
      Team: u.team ? u.team.toUpperCase() : 'NONE',
      Points: u.points || 0
    })).sort((a, b) => b.Points - a.Points);
    exportToExcel(rows, "Leaderboard_Export");
  };

  const handleAdjustPoints = async (userId: string, amount: number) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        points: increment(amount)
      });
    } catch (error) {
      console.error("Failed to adjust points", error);
    }
  };

  const handleToggleTeam = async (userId: string, currentTeam?: string) => {
    const newTeam = currentTeam === "red" ? "blue" : currentTeam === "blue" ? "" : "red";
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, team: newTeam as any } : u));
    setTopUsers(prev => prev.map(u => u.id === userId ? { ...u, team: newTeam as any } : u));
    try {
      await updateDoc(doc(db, "users", userId), { team: newTeam });
      try {
        await updateDoc(doc(db, "users", userId, "public", "profile"), { team: newTeam });
      } catch (e) {}
      toast.success("Team updated successfully!");
    } catch (error) {
      console.error("Failed to update team", error);
      toast.error("Failed to update team.");
    }
  };

  const totalPoints = redPoints + bluePoints || 1;
  const redPercentage = (redPoints / totalPoints) * 100;
  const bluePercentage = (bluePoints / totalPoints) * 100;

  return (
    <PageTransition>
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 md:py-12 flex flex-col gap-6 md:gap-10">
        
        {/* Header */}
        <div className="flex flex-col gap-1 md:gap-2 text-center pt-2 relative">
          <p className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-gray-400">
            COMPETITION
          </p>
          {/* heading shrinks on small screens so it never collides with the export button */}
          <h1 className="font-black text-white uppercase tracking-tighter" style={{ fontSize: 'clamp(1.6rem, 8vw, 3rem)' }}>
            LEADERBOARD
          </h1>
          {isAdmin && (
            <button 
              onClick={handleExport}
              className="absolute right-0 top-0 mt-1 sm:mt-2 md:mt-4 flex items-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-500 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black tracking-widest uppercase transition-colors"
            >
              <Download size={13} /> <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>

        {/* Team Strip */}
        <div className={`bg-[#0f172a] rounded-2xl p-4 md:p-8 border border-white/5 ${primaryGlow} transition-all duration-500`}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex flex-col text-left">
              <span className="text-[10px] md:text-xs font-black tracking-[0.2em] uppercase text-[#FF5F5F]">TEAM RED</span>
              {/* scale points down on very small screens */}
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tighter">{redPoints} <span className="text-xs sm:text-sm text-gray-500">PTS</span></span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] md:text-xs font-black tracking-[0.2em] uppercase text-[#3FCEEE]">TEAM BLUE</span>
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tighter">{bluePoints} <span className="text-xs sm:text-sm text-gray-500">PTS</span></span>
            </div>
          </div>
          <div className="h-3 md:h-4 w-full flex rounded-full overflow-hidden bg-black/50 border border-white/5">
            <div className="bg-[#FF5F5F] transition-all duration-1000 shadow-[0_0_10px_0px_#FF5F5F]" style={{ width: `${redPercentage}%` }} />
            <div className="bg-[#3FCEEE] transition-all duration-1000 shadow-[0_0_10px_0px_#3FCEEE]" style={{ width: `${bluePercentage}%` }} />
          </div>
        </div>

        {/* Top 10 List */}
        <div className="flex flex-col gap-2 md:gap-3">
          <h2 className="text-[11px] md:text-xs font-black tracking-widest text-gray-400 uppercase pl-2 mb-2">TOP PLAYERS</h2>
          
          <div className="flex flex-col bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {topUsers.map((u, i) => {
              const isCurrentUser = user?.uid === u.id;
              
              // Top 3 specific styling
              let rankStyle = "text-gray-500";
              let rankIcon = null;
              if (i === 0) {
                rankStyle = "text-yellow-400";
                rankIcon = <Crown size={16} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
              } else if (i === 1) {
                rankStyle = "text-gray-300";
                rankIcon = <Medal size={16} className="text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" />;
              } else if (i === 2) {
                rankStyle = "text-amber-600";
                rankIcon = <Medal size={16} className="text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />;
              }

              return (
                /*
                 * Mobile row layout:
                 * - Outer div stays flex row but we ensure it never forces horizontal scroll.
                 * - Left side (rank + icon + name) gets min-w-0 + overflow-hidden so name truncates.
                 * - Right side (points + admin controls) is shrink-0 so points are always visible.
                 * - Admin +/- buttons are always visible on mobile (opacity-100), hidden until
                 *   hover on ≥md (opacity-0 group-hover:opacity-100).
                 */
                <div key={u.id} className={`group flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-white/5 transition-colors ${isCurrentUser ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}>
                  {/* Left: rank + team icon + name */}
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0 overflow-hidden">
                    <div className={`flex items-center justify-center w-6 sm:w-8 md:w-10 font-black text-base sm:text-lg md:text-xl tracking-tighter shrink-0 ${rankStyle}`}>
                      {rankIcon ? rankIcon : `#${i + 1}`}
                    </div>
                    
                    {isAdmin ? (
                      <button 
                        onClick={() => handleToggleTeam(u.id, u.team)}
                        className="flex items-center justify-center shrink-0 transition-transform hover:scale-110"
                        title="Click to toggle team"
                      >
                        {u.team === 'red' ? <Flame size={16} className="text-[#FF5F5F] drop-shadow-[0_0_8px_rgba(255,95,95,0.5)]" /> : u.team === 'blue' ? <Droplet size={16} className="text-[#3FCEEE] drop-shadow-[0_0_8px_rgba(63,206,238,0.5)]" /> : <Circle size={16} className="text-gray-500" />}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center shrink-0">
                        {u.team === 'red' ? <Flame size={16} className="text-[#FF5F5F] drop-shadow-[0_0_8px_rgba(255,95,95,0.5)]" /> : u.team === 'blue' ? <Droplet size={16} className="text-[#3FCEEE] drop-shadow-[0_0_8px_rgba(63,206,238,0.5)]" /> : <Circle size={16} className="text-gray-500" />}
                      </div>
                    )}
                    
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs sm:text-sm md:text-base text-white truncate uppercase tracking-tight">
                          {isAdmin ? (u.legalName || u.username || 'ANONYMOUS') : (u.username || 'ANONYMOUS')}
                        </span>
                        {isCurrentUser && (
                          <span className={`text-[8px] sm:text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-full uppercase shrink-0 border ${isIceTheme ? 'bg-[#3FCEEE]/20 text-[#3FCEEE] border-[#3FCEEE]/40' : 'bg-[#FF5F5F]/20 text-[#FF5F5F] border-[#FF5F5F]/40'}`}>
                            YOU
                          </span>
                        )}
                      </div>
                      {isAdmin && u.email && (
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 truncate tracking-widest hidden sm:block">{u.email}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: admin controls + points — always shrink-0 so they never get clipped */}
                  <div className="font-black text-xs sm:text-sm md:text-base tracking-tighter shrink-0 ml-1 sm:ml-2 md:ml-4 flex items-center gap-1 sm:gap-2">
                    {isAdmin && (
                      <div className="flex gap-1 md:gap-2 mr-0.5 sm:mr-1 md:mr-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleAdjustPoints(u.id, 1)} className="p-1 sm:p-1.5 md:p-1 bg-green-500/10 hover:bg-green-500/30 text-green-500 rounded-md"><Plus size={12} /></button>
                        <button onClick={() => handleAdjustPoints(u.id, -1)} className="p-1 sm:p-1.5 md:p-1 bg-red-500/10 hover:bg-red-500/30 text-red-500 rounded-md"><Minus size={12} /></button>
                      </div>
                    )}
                    <span className="text-white">{u.points || 0}</span> <span className="text-gray-500 text-[9px] sm:text-[10px] md:text-xs tracking-widest">PTS</span>
                  </div>
                </div>
              );
            })}
            
            {/* Empty state if no users */}
            {topUsers.length === 0 && (
              <div className="p-8 text-center text-gray-500 font-bold text-xs tracking-widest uppercase">
                NO RANKING DATA AVAILABLE
              </div>
            )}
          </div>
        </div>

        {/* Current user pinned if outside top 10 */}
        {currentUserRank && (
          <div className={`sticky bottom-4 md:bottom-8 mt-2 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 md:p-5 flex items-center justify-between ${primaryGlow} z-10`}>
             <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0 overflow-hidden">
                <div className="flex items-center justify-center w-6 sm:w-8 md:w-10 font-black text-base sm:text-lg md:text-xl tracking-tighter text-gray-500 shrink-0">
                  -
                </div>
                
                <div className="flex items-center justify-center shrink-0">
                  {currentUserRank.data.team === 'red' ? <Flame size={16} className="text-[#FF5F5F] drop-shadow-[0_0_8px_rgba(255,95,95,0.5)]" /> : currentUserRank.data.team === 'blue' ? <Droplet size={16} className="text-[#3FCEEE] drop-shadow-[0_0_8px_rgba(63,206,238,0.5)]" /> : <Circle size={16} className="text-gray-500" />}
                </div>
                
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-xs sm:text-sm md:text-base text-white truncate uppercase tracking-tight">
                    {currentUserRank.data.username || 'ANONYMOUS'}
                  </span>
                  <span className={`text-[8px] sm:text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-full uppercase shrink-0 border ${isIceTheme ? 'bg-[#3FCEEE]/20 text-[#3FCEEE] border-[#3FCEEE]/40' : 'bg-[#FF5F5F]/20 text-[#FF5F5F] border-[#FF5F5F]/40'}`}>
                    YOU
                  </span>
                </div>
              </div>
              <div className="font-black text-xs sm:text-sm md:text-base tracking-tighter shrink-0 ml-2 sm:ml-4">
                <span className="text-white">{currentUserRank.data.points || 0}</span> <span className="text-gray-500 text-[9px] sm:text-[10px] md:text-xs tracking-widest">PTS</span>
              </div>
          </div>
        )}

      </div>
    </PageTransition>
  );
}
