"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";
import { 
  User, 
  ChevronLeft, 
  Save, 
  Loader2, 
  History,
  AlertCircle,
  Upload,
  X,
  Lock
} from "lucide-react";
import Image from "next/image";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  Timestamp 
} from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { db } from "@/lib/firebase";

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type || "image/jpeg", 0.7)); 
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isIceTheme } = useTheme();
  const router = useRouter();

  const [gamerTag, setGamerTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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

    setSaving(true);
    try {
      let finalPhotoUrl = userData.photoURL || "";
      const updateData: any = {};

      // 1. Handle Photo Upload
      if (selectedFile) {
        finalPhotoUrl = await resizeImage(selectedFile, 300, 300);
        updateData.photoURL = finalPhotoUrl;
      }

      // 2. Handle Gamer Tag Change
      if (gamerTag.trim() !== userData.gamerTag) {
        // Check month limits
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentChanges = (userData.usernameChanges || []).filter((change: any) => {
          const changeDate = change.date.toDate ? change.date.toDate() : new Date(change.date);
          return changeDate > thirtyDaysAgo;
        });

        if (recentChanges.length >= 3) {
          toast.error("Limit reached", {
            description: "Username change blocked, but photo updates will still save."
          });
        } else {
          updateData.gamerTag = gamerTag.trim();
          updateData.usernameChanges = arrayUnion({
            old: userData.gamerTag,
            new: gamerTag.trim(),
            date: Timestamp.now()
          });
        }
      }

      // 3. Finalize Update
      if (Object.keys(updateData).length === 0) {
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, "users", user.uid), updateData);
      setUserData({ ...userData, ...updateData });
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success("Profile updated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile.");
    }
    setSaving(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    const now = new Date();
    if (userData.lastPasswordReset) {
      const lastResetDate = userData.lastPasswordReset.toDate ? userData.lastPasswordReset.toDate() : new Date(userData.lastPasswordReset);
      const hoursSinceLastReset = (now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReset < 12) {
        const hoursLeft = (12 - hoursSinceLastReset).toFixed(1);
        toast.error(`Please wait ${hoursLeft} hours before resetting your password again.`);
        return;
      }
    }

    setIsResettingPassword(true);
    try {
      await updatePassword(user, newPassword);
      await updateDoc(doc(db, "users", user.uid), {
        lastPasswordReset: Timestamp.now()
      });
      setUserData({ ...userData, lastPasswordReset: Timestamp.now() });
      setNewPassword("");
      toast.success("Password updated successfully!");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Please re-login to change your password.");
      } else {
        toast.error("Failed to update password.");
      }
    }
    setIsResettingPassword(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum size is 2MB" });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
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
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent" />
               
               <form onSubmit={handleSave} className="flex flex-col gap-8">
                  {/* Photo Upload Section */}
                  <div className="flex flex-col items-center gap-4 py-4 border-b border-white/5 mb-2">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors bg-black/40">
                        {previewUrl || userData?.photoURL ? (
                          <Image 
                            src={previewUrl || userData.photoURL} 
                            alt="Profile" 
                            width={96} 
                            height={96} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <User size={40} />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors border-2 border-[#1a1a1a]">
                        <Upload size={14} className="text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                      {selectedFile && (
                        <button 
                          type="button"
                          onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all backdrop-blur-sm"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Profile Picture</p>
                      <p className="text-[9px] text-gray-600 uppercase tracking-tighter mt-1">Recommended: 300x300 JPG/PNG</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-1">Gamer Tag</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                      <input 
                        type="text" 
                        value={gamerTag}
                        onChange={(e) => setGamerTag(e.target.value)}
                        placeholder="Choose your handle..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-all text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 px-1 mt-1 uppercase tracking-tight">Characters: {gamerTag.length} / 20</p>
                 </div>

                 <button 
                  disabled={saving || (gamerTag === userData?.gamerTag && !selectedFile)}
                  className="bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:hover:bg-primary text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[var(--shadow-primary)]"
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

            {/* Password Reset Section */}
            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden mt-2">
               <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent ${isIceTheme ? 'via-cyan-500/30' : 'via-red-500/30'} to-transparent`} />
               <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                 <Lock size={20} className={isIceTheme ? "text-cyan-500" : "text-red-500"} /> CHANGE PASSWORD
               </h3>
               <form onSubmit={handlePasswordReset} className="flex flex-col gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password..."
                        className={`w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none transition-all text-sm ${isIceTheme ? 'focus:border-cyan-500/50' : 'focus:border-red-500/50'}`}
                      />
                    </div>
                 </div>
                 <button 
                  disabled={isResettingPassword || !newPassword}
                  className={`${isIceTheme ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border-cyan-500/20 disabled:hover:bg-cyan-500/10' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 disabled:hover:bg-red-500/10'} disabled:opacity-50 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2`}
                 >
                   {isResettingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                   {isResettingPassword ? "UPDATING..." : "UPDATE PASSWORD"}
                 </button>
               </form>
               <p className={`text-[9px] ${isIceTheme ? 'text-cyan-500/80' : 'text-red-500/80'} uppercase font-bold tracking-widest mt-2 flex items-center gap-2`}>
                 <AlertCircle size={10} /> 12-HOUR COOLDOWN APPLIES AFTER EACH RESET
               </p>
            </div>
          </div>

          {/* Stats/Status */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <History size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{3 - recentChanges.length}</div>
                  <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">Changes Left</div>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
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
