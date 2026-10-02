"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import PageTransition from "@/components/PageTransition";
import { Crown, Medal, Download } from "lucide-react";
import { exportToExcel } from "@/lib/excel";

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
  team?: "red" | "blue";
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
  }, [user]);

  const handleExport = () => {
    const rows = allUsers.map(u => ({
      Name: u.username || 'ANONYMOUS',
      Team: u.team ? u.team.toUpperCase() : 'NONE',
      Points: u.points || 0
    })).sort((a, b) => b.Points - a.Points);
    exportToExcel(rows, "Leaderboard_Export");
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
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            LEADERBOARD
          </h1>
          {isAdmin && (
            <button 
              onClick={handleExport}
              className="absolute right-0 top-0 mt-2 md:mt-4 flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 md:px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-colors"
            >
              <Download size={14} /> <span className="hidden md:inline">Export</span>
            </button>
          )}
        </div>

        {/* Team Strip */}
        <div className={`bg-[#0f172a] rounded-2xl p-5 md:p-8 border border-white/5 ${primaryGlow} transition-all duration-500`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 mb-4 md:mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs font-black tracking-[0.2em] uppercase text-[#FF5F5F]">TEAM RED</span>
              <span className="text-2xl md:text-3xl font-black text-white tracking-tighter">{redPoints} <span className="text-sm text-gray-500">PTS</span></span>
            </div>
            <div className="flex flex-col text-left md:text-right">
              <span className="text-[10px] md:text-xs font-black tracking-[0.2em] uppercase text-[#3FCEEE]">TEAM BLUE</span>
              <span className="text-2xl md:text-3xl font-black text-white tracking-tighter">{bluePoints} <span className="text-sm text-gray-500">PTS</span></span>
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
                <div key={u.id} className={`flex items-center justify-between p-4 md:p-5 border-b border-white/5 transition-colors ${isCurrentUser ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}>
                  <div className="flex items-center gap-3 md:gap-5 min-w-0">
                    <div className={`flex items-center justify-center w-8 md:w-10 font-black text-lg md:text-xl tracking-tighter ${rankStyle}`}>
                      {rankIcon ? rankIcon : `#${i + 1}`}
                    </div>
                    
                    {u.team ? (
                      <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0 ${u.team === 'red' ? teamRedDot : teamBlueDot}`} />
                    ) : (
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0 bg-gray-600" />
                    )}
                    
                    <span className="font-bold text-sm md:text-base text-white truncate uppercase tracking-tight">
                      {u.username || 'ANONYMOUS'}
                    </span>
                    {isCurrentUser && (
                      <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase shrink-0 border ${isIceTheme ? 'bg-[#3FCEEE]/20 text-[#3FCEEE] border-[#3FCEEE]/40' : 'bg-[#FF5F5F]/20 text-[#FF5F5F] border-[#FF5F5F]/40'}`}>
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="font-black text-sm md:text-base tracking-tighter shrink-0 ml-4">
                    <span className="text-white">{u.points || 0}</span> <span className="text-gray-500 text-[10px] md:text-xs tracking-widest">PTS</span>
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
          <div className={`sticky bottom-4 md:bottom-8 mt-2 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 flex items-center justify-between ${primaryGlow} z-10`}>
             <div className="flex items-center gap-3 md:gap-5 min-w-0">
                <div className="flex items-center justify-center w-8 md:w-10 font-black text-lg md:text-xl tracking-tighter text-gray-500">
                  -
                </div>
                
                {currentUserRank.data.team ? (
                  <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0 ${currentUserRank.data.team === 'red' ? teamRedDot : teamBlueDot}`} />
                ) : (
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0 bg-gray-600" />
                )}
                
                <span className="font-bold text-sm md:text-base text-white truncate uppercase tracking-tight">
                  {currentUserRank.data.username || 'ANONYMOUS'}
                </span>
                <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase shrink-0 border ${isIceTheme ? 'bg-[#3FCEEE]/20 text-[#3FCEEE] border-[#3FCEEE]/40' : 'bg-[#FF5F5F]/20 text-[#FF5F5F] border-[#FF5F5F]/40'}`}>
                  YOU
                </span>
              </div>
              <div className="font-black text-sm md:text-base tracking-tighter shrink-0 ml-4">
                <span className="text-white">{currentUserRank.data.points || 0}</span> <span className="text-gray-500 text-[10px] md:text-xs tracking-widest">PTS</span>
              </div>
          </div>
        )}

      </div>
    </PageTransition>
  );
}
