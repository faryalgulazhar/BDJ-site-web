"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  ChevronDown,
  MessageSquare,
  CheckCheck,
  X,
  Loader2
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  writeBatch, 
  doc,
  addDoc,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [gamerTag, setGamerTag] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const isAdmin = user?.email === "admin@bdj-karukera.com";
  
  // Notification States (Integrated from NotificationBell)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
        const data = snap.docs[0]?.data();
        
        if (isAdmin) {
          setGamerTag("ADMIN");
        } else {
          setGamerTag(data?.gamerTag || user.displayName || user.email?.split('@')[0].toUpperCase() || "PLAYER");
        }
        
        setPhotoURL(data?.photoURL || user.photoURL || null);
      } catch { 
        setGamerTag(isAdmin ? "ADMIN" : (user.email?.split('@')[0].toUpperCase() || "PLAYER")); 
      }
    })();
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user) return;
    const targets = isAdmin ? [user.uid, "admin"] : [user.uid];
    const q = query(
      collection(db, "notifications"),
      where("toUid", "in", targets)
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(docs);
    });
    return () => unsub();
  }, [user, isAdmin]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowNotifs(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  };

  const clearAllNotifications = async () => {
    if (!notifications.length) return;
    const batch = writeBatch(db);
    notifications.forEach((n) => batch.delete(doc(db, "notifications", n.id)));
    await batch.commit();
    setNotifications([]);
    toast.success("Notifications cleared.");
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyTo || !replyText.trim()) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, "member_messages"), {
        fromUid: user.uid,
        fromEmail: user.email,
        toUid: "admin",
        originalSession: replyTo.sessionTitle,
        content: replyText.trim(),
        read: false,
        createdAt: serverTimestamp(),
      });
      setIsReplyOpen(false);
      setReplyTo(null);
      setReplyText("");
      toast.success("Reply sent to admin.");
    } catch (e) {
      toast.error("Failed to send reply.");
    }
    setIsSending(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5F5F]/20 to-amber-500/20 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform overflow-hidden">
          {photoURL ? (
            <Image src={photoURL} alt="User" width={32} height={32} className="w-full h-full object-cover" />
          ) : (
            <User size={16} className="text-[#FF5F5F]" />
          )}
        </div>
        <div className="flex flex-col items-start hidden sm:flex">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{isAdmin ? "Admin" : "Profile"}</span>
          <span className={`text-[11px] font-black truncate max-w-[100px] uppercase tracking-tighter ${isAdmin ? "text-[#FF5F5F]" : "text-white"}`}>
            {gamerTag ?? user.email?.split('@')[0].toUpperCase()}
          </span>
        </div>
        <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF5F5F] flex items-center justify-center text-[8px] font-black text-white shadow-[0_0_10px_-2px_#FF5F5F]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+12px)] w-72 bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF5F5F]/50 to-transparent" />
          
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
              {photoURL ? (
                <Image src={photoURL} alt="User" width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#FF5F5F]/50">
                  <User size={20} />
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] text-gray-500 font-black tracking-widest uppercase mb-0.5">{isAdmin ? "Administrator" : "Authenticated Account"}</p>
              <p className="text-xs font-bold truncate">
                <span className={isAdmin ? "text-[#FF5F5F]" : "text-white"}>{gamerTag ?? user.email?.split('@')[0].toUpperCase()}</span>
              </p>
              <p className="text-[9px] text-gray-600 truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="p-2">
            {/* NOTIFICATIONS SECTION */}
            <button 
              onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${showNotifs ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <Bell size={16} />
                <span className="text-[11px] font-black uppercase tracking-widest">Notifications</span>
              </div>
              {unreadCount > 0 && <span className="bg-[#FF5F5F] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>

            {showNotifs && (
              <div className="mt-1 max-h-60 overflow-y-auto custom-scrollbar px-2 pb-2">
                {notifications.length === 0 ? (
                  <p className="text-[10px] text-gray-600 text-center py-6 font-bold uppercase tracking-widest">No alerts today</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map(n => (
                      <div key={n.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] relative group">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] text-[#FF5F5F] font-black uppercase tracking-widest">{n.sessionTitle}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F5F]" />}
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-2">{n.message}</p>
                        <button 
                          onClick={() => { setReplyTo(n); setIsReplyOpen(true); }}
                          className="text-[9px] text-white/50 hover:text-[#FF5F5F] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare size={10} /> Reply to admin
                        </button>
                      </div>
                    ))}
                    {notifications.length > 0 && (
                      <button onClick={clearAllNotifications} className="text-[9px] text-gray-500 hover:text-red-400 font-black uppercase tracking-widest p-2 text-center flex items-center justify-center gap-2">
                        <CheckCheck size={12} /> Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="h-px bg-white/5 my-2 mx-2" />

            <Link 
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              <Settings size={16} />
              <span className="text-[11px] font-black uppercase tracking-widest">Settings</span>
            </Link>

            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-500/10"
            >
              <LogOut size={16} />
              <span className="text-[11px] font-black uppercase tracking-widest">Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal (Integrated) */}
      {isReplyOpen && replyTo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-[#141414] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setIsReplyOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">REPLY TO ADMIN</h3>
            <p className="text-[#FF5F5F] text-[10px] font-black uppercase tracking-widest mb-6">RE: {replyTo.sessionTitle}</p>
            
            <form onSubmit={handleSendReply} className="flex flex-col gap-5">
              <textarea 
                required
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your message here..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-all resize-none shadow-inner"
              />
              <button 
                disabled={isSending}
                className="bg-[#FF5F5F] hover:bg-[#ff4040] disabled:opacity-50 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_#FF5F5F]"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                {isSending ? "SENDING..." : "SEND REPLY"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
