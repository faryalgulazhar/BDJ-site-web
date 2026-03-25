"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X, MessageSquare, CheckCheck } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  sessionTitle: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Real-time listener for this user's notifications
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      console.log("NOTIF DEBUG: Received snapshot for UID:", user.uid, "Count:", snap.docs.length);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
      // Sort client-side by createdAt desc
      docs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setNotifications(docs);
    });
    return () => unsub();
  }, [user]);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
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

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setIsOpen((o) => !o); if (!isOpen) markAllRead(); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell size={16} className="text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] flex items-center justify-center rounded-full bg-[#FF5F5F] text-white text-[9px] font-black px-1 shadow-[0_0_10px_-2px_#FF5F5F]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-80 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <span className="text-[11px] font-black text-white tracking-widest uppercase">NOTIFICATIONS</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
          </div>

          {/* Messages list */}
          <div className="overflow-y-auto max-h-72">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-600">
                <Bell size={28} strokeWidth={1.5} />
                <p className="text-[11px] font-bold uppercase tracking-widest">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`flex gap-3 px-5 py-4 border-b border-white/5 last:border-0 transition-colors ${!n.read ? "bg-white/[0.03]" : ""}`}>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare size={14} className="text-blue-400" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-400/80 font-black uppercase tracking-widest truncate">{n.sessionTitle}</span>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F5F] shrink-0" />}
                    </div>
                    <p className="text-[12px] text-gray-300 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-gray-600 font-medium">{formatDate(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-white/5">
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-black tracking-widest">
                <CheckCheck size={12} /> Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
