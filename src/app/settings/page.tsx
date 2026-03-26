"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { 
  User, 
  ChevronLeft, 
  Save, 
  Loader2, 
  History,
  AlertCircle
} from "lucide-react";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [gamerTag, setGamerTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          setGamerTag(data.gamerTag || "");
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load profile.");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    if (gamerTag === userData.gamerTag) return;

    // Check month limits
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentChanges = (userData.usernameChanges || []).filter((change: any) => {
      const changeDate = change.date.toDate ? change.date.toDate() : new Date(change.date);
      return changeDate > thirtyDaysAgo;
    });

    if (recentChanges.length >= 3) {
      toast.error("Limit reached", {
        description: "You can only change your username 3 times every 30 days."
      });
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        gamerTag: gamerTag.trim(),
        usernameChanges: arrayUnion({
          old: userData.gamerTag,
          new: gamerTag.trim(),
          date: Timestamp.now()
        })
      });
      setUserData({ ...userData, gamerTag: gamerTag.trim() });
      toast.success("Profile updated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF5F5F]" size={32} />
      </div>
    );
  }

  const recentChanges = (userData?.usernameChanges || []).filter((change: any) => {
    const changeDate = change.date.toDate ? change.date.toDate() : new Date(change.date);
    return changeDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  });

  return (
    <main className="min-h-screen bg-[#121212] pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-widest">Back</span>
        </button>

        <div className="flex flex-col gap-2 mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">SETTINGS</h1>
          <p className="text-gray-500 uppercase text-[11px] font-black tracking-[0.2em]">Manage your Arena Profile</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF5F5F]/30 to-transparent" />
               
               <form onSubmit={handleSave} className="flex flex-col gap-8">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-1">Gamer Tag</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                      <input 
                        type="text" 
                        value={gamerTag}
                        onChange={(e) => setGamerTag(e.target.value)}
                        placeholder="Choose your handle..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-[#FF5F5F]/50 transition-all text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 px-1 mt-1 uppercase tracking-tight">Characters: {gamerTag.length} / 20</p>
                 </div>

                 <button 
                  disabled={saving || gamerTag === userData?.gamerTag}
                  className="bg-[#FF5F5F] hover:bg-[#ff4040] disabled:opacity-50 disabled:hover:bg-[#FF5F5F] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_-5px_#FF5F5F]"
                 >
                   {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                   {saving ? "SAVING..." : "UPDATE PROFILE"}
                 </button>
               </form>
            </div>

            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-white">
                <AlertCircle size={18} className="text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest">Username Policy</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                To maintain community integrity, we limit username changes to <span className="text-white font-bold">3 changes per 30-day period</span>. Choose wisely.
              </p>
            </div>
          </div>

          {/* Stats/Status */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#FF5F5F]/10 border border-[#FF5F5F]/20 flex items-center justify-center text-[#FF5F5F]">
                  <History size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{3 - recentChanges.length}</div>
                  <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">Changes Left</div>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-[#FF5F5F] transition-all duration-1000" 
                    style={{ width: `${((3 - recentChanges.length) / 3) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-600 uppercase tracking-tight">Resets in 30 days from last change</p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6">
               <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                 <User size={12} /> ACCOUNT INFO
               </h3>
               <div className="flex flex-col gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Email</span>
                    <span className="text-xs text-white/70 font-bold truncate">{user?.email}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Verified</span>
                    <span className="text-[10px] text-green-500/80 font-black uppercase">STATUS: ACTIVE</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
