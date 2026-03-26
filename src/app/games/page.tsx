"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Plus,
  Users,
  Calendar,
  Clock,
  Lock,
  CheckCircle,
  Loader2,
  X,
  ShieldCheck,
  Trash2,
  Pencil,
  AlertCircle,
  MoreVertical,
  Check,
} from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageSquare } from "lucide-react";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import {
  deleteSessionAction,
  approveSessionAction,
  updateSessionAction,
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction
} from "./actions";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type GameCategory = "VIDEO GAME" | "BOARD GAME" | "TOURNAMENT";
type SessionApproval = "pending" | "approved";
type RegistrationStatus = "open" | "full" | "registered";

interface Session {
  id: string;
  title: string;
  category: GameCategory;
  date: string;
  time: string;
  location: string;
  eventTimestamp?: any; // For 48h checks
  totalSpots: number;
  currentRegistrations: number;
  status: RegistrationStatus;
  approval: SessionApproval;
  suggestedBy?: string;
  suggestedByEmail?: string;
  createdAt?: any;
}

type Tab = "ALL" | "VIDEO GAMES" | "BOARD GAMES" | "TOURNAMENTS";
const tabs: Tab[] = ["ALL", "VIDEO GAMES", "BOARD GAMES", "TOURNAMENTS"];

const categoryToTab: Record<GameCategory, Tab> = {
  "VIDEO GAME": "VIDEO GAMES",
  "BOARD GAME": "BOARD GAMES",
  TOURNAMENT: "TOURNAMENTS",
};

const categoryColors: Record<GameCategory, string> = {
  "VIDEO GAME": "bg-primary/20 text-primary border border-primary/40",
  "BOARD GAME": "bg-amber-500/20 text-amber-400 border border-amber-500/40",
  TOURNAMENT: "bg-violet-500/20 text-violet-400 border border-violet-500/40",
};

const ADMIN_EMAIL = "admin@bdj-karukera.com";

// Default seed sessions so there's always content
const SEED_SESSIONS: Omit<Session, "id">[] = [
  { title: "TEKKEN 8 CLASH", category: "VIDEO GAME", date: "MAY 14, 2025", time: "19:00 – 22:00", location: "ROOM 101", totalSpots: 10, currentRegistrations: 4, status: "open", approval: "approved" },
  { title: "DUNE IMPERIUM", category: "BOARD GAME", date: "MAY 15, 2025", time: "18:30 – 23:00", location: "COMMUNITY HUB", totalSpots: 5, currentRegistrations: 3, status: "open", approval: "approved" },
  { title: "STREET FIGHTER VI", category: "TOURNAMENT", date: "MAY 12, 2025", time: "20:00 – 00:00", location: "GAMING LOUNGE", totalSpots: 8, currentRegistrations: 8, status: "full", approval: "approved" },
  { title: "EA FC 25 LEAGUE", category: "VIDEO GAME", date: "MAY 18, 2025", time: "17:00 – 20:00", location: "ROOM 204", totalSpots: 8, currentRegistrations: 4, status: "open", approval: "approved" },
  { title: "MARIO KART CUP", category: "TOURNAMENT", date: "MAY 20, 2025", time: "19:00 – 23:00", location: "EVENT HALL", totalSpots: 16, currentRegistrations: 15, status: "open", approval: "approved" },
];

// ─────────────────────────────────────────────
// Session Form Fields (Unified for Suggest/Create/Edit)
// ─────────────────────────────────────────────
const SessionFormFields = ({ form, setForm }: { form: any; setForm: (f: any) => void }) => (
  <>
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase px-1">Session Title</label>
      <input
        required
        type="text"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        placeholder="E.g. TEKKEN 8 TOURNAMENT"
        className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-all shadow-inner"
      />
    </div>
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase px-1">Category</label>
      <select
        required
        value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value as GameCategory })}
        className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-base focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
      >
        <option value="VIDEO GAME">VIDEO GAME</option>
        <option value="BOARD GAME">BOARD GAME</option>
        <option value="TOURNAMENT">TOURNAMENT</option>
      </select>
    </div>
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase px-1">Location / Game Room</label>
      <input
        required
        type="text"
        value={form.location}
        onChange={e => setForm({ ...form, location: e.target.value })}
        placeholder="E.g. ROOM 101"
        className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-all shadow-inner"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase px-1">Date</label>
        <input
          required
          type="text"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
          placeholder="MAY 14, 2025"
          className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-all shadow-inner"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase px-1">Time</label>
        <input
          required
          type="text"
          value={form.time}
          onChange={e => setForm({ ...form, time: e.target.value })}
          placeholder="19:00 - 22:00"
          className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-base focus:outline-none focus:border-primary/50 transition-all shadow-inner"
        />
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase px-1">Available Spots</label>
      <input
        required
        type="number"
        min={1}
        value={form.totalSpots}
        onChange={e => setForm({ ...form, totalSpots: e.target.value })}
        className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-all shadow-inner font-bold"
      />
    </div>
  </>
);

// ─────────────────────────────────────────────
// Session Card
// ─────────────────────────────────────────────
interface CardProps {
  session: Session;
  isLoadingId: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isRegistered: boolean;
  onRegister: (id: string) => void;
  onUnregister: (id: string) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (session: Session) => void;
  onViewAttendees: (session: Session) => void;
}

function SessionCard({ 
  session, 
  isLoadingId, 
  isLoggedIn, 
  isAdmin, 
  isRegistered, 
  onRegister, 
  onUnregister, 
  onApprove,
  onDelete, 
  onEdit, 
  onViewAttendees 
}: CardProps) {
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const spotsLeft = session.totalSpots - session.currentRegistrations;
  const isFull = session.status === "full" || spotsLeft <= 0;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 gap-5 transition-all duration-500 ${
        isFull
          ? "bg-[#0f172a]/50 border-white/5 opacity-60"
          : isRegistered
          ? "bg-[#0f172a] border-green-500/30 shadow-[0_0_30px_-10px_#22c55e]"
          : "bg-[#0f172a] border-white/10 hover:border-primary/40 hover:shadow-[var(--shadow-primary)]"
      }`}
    >
      {session.approval === "pending" && (
        <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md uppercase border border-amber-500/20 w-fit">
          PENDING
        </span>
      )}

      {/* Admin controls dropdown */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-gray-400 hover:text-white transition-all backdrop-blur-md border border-white/10"
          >
            <MoreVertical size={14} />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }}
              />
              <div className="absolute top-full right-0 mt-2 flex flex-col gap-1 bg-[#0f172a]/95 border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-3xl min-w-[140px] origin-top-right animate-in fade-in zoom-in-95 duration-200 z-40">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); onViewAttendees(session); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-500/10 text-gray-300 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all w-full text-left"
                >
                  <Users size={12} /> ATTENDEES
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); onEdit(session); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-500/10 text-gray-300 hover:text-amber-400 text-[10px] font-black uppercase tracking-widest transition-all w-full text-left"
                >
                  <Pencil size={12} /> EDIT
                </button>
                <div className="h-px bg-white/10 my-1 w-full" />
                <button
                  onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); onDelete(session.id); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-gray-300 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all w-full text-left"
                >
                  <Trash2 size={12} /> DELETE
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase ${categoryColors[session.category]}`}>
          {session.category}
        </span>
        {isFull ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-white/40">
            <Clock size={12} />
            {t.games.tournamentFull}
          </span>
        ) : isRegistered ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-green-400">
            <CheckCircle size={12} />
            {t.games.registeredBadge}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-bold text-white/60">
            <Users size={12} />
            {spotsLeft} / {session.totalSpots} {t.games.spotsLeft.toLowerCase()}
          </span>
        )}
      </div>

      {/* Title & meta */}
      <div className="flex flex-col gap-2 flex-1">
        <h3 className="text-xl font-black tracking-tight text-white leading-tight">{session.title}</h3>
        <div className="flex flex-col gap-1 text-white/50 text-[13px]">
          <span className="flex items-center gap-2"><Calendar size={13} />{session.date}</span>
          <span className="flex items-center gap-2"><Clock size={13} />{session.time}</span>
          <span className="flex items-center gap-2 font-black text-primary/70 uppercase tracking-tighter text-[11px]"><Plus size={12} className="rotate-45" /> {session.location}</span>
        </div>
        {session.suggestedByEmail && (
          <span className="text-[9px] text-gray-600 uppercase tracking-widest">suggested by {session.suggestedByEmail}</span>
        )}
      </div>

      {/* Action button */}
      <div className="flex flex-col gap-2">
        {!isRegistered ? (
          <button
            disabled={isFull && session.approval !== "pending"}
            onClick={() => session.approval === "pending" ? onApprove(session.id) : onRegister(session.id)}
            className={`w-full py-3 rounded-xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-500 flex items-center justify-center gap-2 ${
              session.approval === "pending"
                ? "bg-green-500 hover:bg-green-600 text-white shadow-[0_0_30px_-10px_#22c55e]"
                : isFull
                ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                : "bg-primary hover:bg-primary/80 text-white shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary)]"
            }`}
          >
            {isLoadingId === session.id ? (
              <Loader2 size={14} className="animate-spin" />
            ) : session.approval === "pending" ? (
              <>
                <Check size={14} strokeWidth={3} /> APPROVE
              </>
            ) : isFull ? (
              t.games.tournamentFull
            ) : (
              t.games.registerTrigger
            )}
          </button>
        ) : (
          <button
            onClick={() => onUnregister(session.id)}
            className="w-full py-3 rounded-xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-500 flex items-center justify-center gap-2 bg-[#0f172a] border border-green-500/30 text-green-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 group"
          >
            {isLoadingId === session.id ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <CheckCircle size={14} className="group-hover:hidden" />
                <span className="group-hover:hidden">{t.games.registeredBadge}</span>
                <X size={14} className="hidden group-hover:block" />
                <span className="hidden group-hover:block uppercase">Unregister</span>
              </>
            )}
          </button>
        )}

        {!isLoggedIn && !isFull && !isRegistered && (
          <p className="text-center text-[10px] text-white/20 -mt-2 font-medium">{t.games.loginRequiredDesc}</p>
        )}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
const EMPTY_FORM = { title: "", category: "VIDEO GAME" as GameCategory, date: "", time: "", location: "", totalSpots: 8 };

export default function GamesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isIceTheme } = useTheme();

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isLoggedIn = !!user;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Modals
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registrations state
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [activeSessionForAttendees, setActiveSessionForAttendees] = useState<Session | null>(null);

  // Unregistration
  const [isUnregisterOpen, setIsUnregisterOpen] = useState(false);
  const [unregisterId, setUnregisterId] = useState<string | null>(null);
  const [unregisterReason, setUnregisterReason] = useState("");
  const [isUnregistering, setIsUnregistering] = useState(false);

  // Forms
  const [suggestForm, setSuggestForm] = useState({ ...EMPTY_FORM, reason: "" });
  const [adminForm, setAdminForm] = useState({ ...EMPTY_FORM });

  // ── Load sessions ──
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "sessions"), orderBy("createdAt", "desc")));
        let sessionData: Session[] = [];
        if (snap.empty) {
          // seed initial data
          for (const s of SEED_SESSIONS) {
            await addDoc(collection(db, "sessions"), { ...s, createdAt: serverTimestamp() });
          }
          const snap2 = await getDocs(query(collection(db, "sessions"), orderBy("createdAt", "desc")));
          sessionData = snap2.docs.map(d => ({ id: d.id, ...d.data() } as Session));
        } else {
          sessionData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Session));
        }
        setSessions(sessionData);

        // Fetch current user's registrations
        if (user) {
          const regSnap = await getDocs(query(collection(db, "registrations"), where("userId", "==", user.uid)));
          setUserRegistrations(regSnap.docs.map(d => d.data().sessionId));
        } else {
          setUserRegistrations([]);
        }


      } catch (e) { console.error(e); }
      setIsLoading(false);
    };
    load();
  }, []);

  const reloadSessions = async () => {
    const snap = await getDocs(query(collection(db, "sessions"), orderBy("createdAt", "desc")));
    setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session)));
    if (user) {
      const regSnap = await getDocs(query(collection(db, "registrations"), where("userId", "==", user.uid)));
      setUserRegistrations(regSnap.docs.map(d => d.data().sessionId));
    }

  };



  // ── Register ──
  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      await updateDoc(doc(db, "sessions", id), { approval: "approved" });
      await reloadSessions();
      toast.success("Session approved!");
    } catch {
      toast.error("Failed to approve session.");
    }
    setLoadingId(null);
  };

  const handleRegister = async (id: string) => {
    if (!isLoggedIn) { router.push("/register"); return; }
    const session = sessions.find(s => s.id === id);
    if (!session || session.status === "full" || userRegistrations.includes(id)) return;

    setLoadingId(id);
    try {
      // Fetch user profile for gamerTag
      const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
      const gamerTag = userSnap.docs[0]?.data()?.gamerTag || user.displayName || "Gamer";

      // 1. Create registration doc
      await addDoc(collection(db, "registrations"), {
        sessionId: id,
        userId: user.uid,
        userEmail: user.email,
        userGamerTag: gamerTag,
        timestamp: serverTimestamp(),
      });

      // 2. Increment session registrations
      await updateDoc(doc(db, "sessions", id), {
        currentRegistrations: (session.currentRegistrations || 0) + 1,
        status: (session.currentRegistrations + 1) >= session.totalSpots ? "full" : "open"
      });

      await reloadSessions();
      toast.success(`Registered for ${session.title}!`);
    } catch (e) {
      console.error(e);
      toast.error("Registration failed.");
    }
    setLoadingId(null);
  };

  // ── Unregister Trigger ──
  const handleUnregister = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session || !user) return;

    // 48h Check using Mac system time (new Date())
    try {
      if (!isAdmin) {
        const eventDate = new Date(session.date);
        const now = new Date(); // Local system time
        const diffMs = eventDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 48) {
          toast.error("Cannot unregister within 48h of the event.", {
            description: "Please contact an admin if you have an emergency."
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Date parsing failed, skipping 48h check safely.");
    }

    setUnregisterId(id);
    setUnregisterReason("");
    setIsUnregisterOpen(true);
  };

  // ── Finalize Unregistration ──
  const confirmUnregister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unregisterId || !unregisterReason.trim() || !user) return;

    const session = sessions.find(s => s.id === unregisterId);
    if (!session) return;

    setIsUnregistering(true);
    try {
      // 1. Find and delete registration doc
      const q = query(collection(db, "registrations"), where("sessionId", "==", unregisterId), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "registrations", d.id));
      }

      // 2. Decrement session registrations
      await updateDoc(doc(db, "sessions", unregisterId), {
        currentRegistrations: Math.max(0, session.currentRegistrations - 1),
        status: "open"
      });

      // 3. Notify Admin
      await addDoc(collection(db, "notifications"), {
        toUid: "admin", // Special ID for admin dashboard
        sessionTitle: session.title,
        message: `User ${user.email} unregistered. Reason: ${unregisterReason.trim()}`,
        fromUid: user.uid,
        read: false,
        createdAt: serverTimestamp(),
      });

      // 4. Send confirmation to the user's own notification bell
      await addDoc(collection(db, "notifications"), {
        toUid: user.uid,
        sessionTitle: session.title,
        message: `You have been unregistered from "${session.title}". Your reason has been logged.`,
        read: false,
        createdAt: serverTimestamp(),
      });

      await reloadSessions();
      setIsUnregisterOpen(false);
      setUnregisterId(null);
      setUnregisterReason("");
      toast.success("Unregistered successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to unregister.");
    }
    setIsUnregistering(false);
  };

  // ── Admin: View Attendees ──
  const handleViewAttendees = async (session: Session) => {
    setActiveSessionForAttendees(session);
    setAttendees([]);
    setIsAttendeesOpen(true);
    try {
      const q = query(collection(db, "registrations"), where("sessionId", "==", session.id));
      const snap = await getDocs(q);
      setAttendees(snap.docs.map(d => d.data()));
    } catch (e) { toast.error("Failed to fetch attendees."); }
  };

  // ── Suggest session (member) ──
  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return; // Prevention of double logic
    setIsSubmitting(true);
    
    const newSessionData = {
      title: suggestForm.title.toUpperCase(),
      category: suggestForm.category,
      date: suggestForm.date.toUpperCase(),
      time: suggestForm.time,
      location: suggestForm.location.toUpperCase(),
      totalSpots: Number(suggestForm.totalSpots),
      currentRegistrations: 0,
      status: "open",
      approval: "pending",
      suggestedBy: user.uid,
      suggestedByEmail: user.email,
    };

    // Optimistic UI update
    const tempId = "temp-" + Date.now();
    setSessions(prev => [{ id: tempId, ...newSessionData, createdAt: new Date() } as any, ...prev]);
    setIsSuggestOpen(false);
    toast.success("Session suggested! Waiting for admin approval.");

    try {
      const docRef = await addDoc(collection(db, "sessions"), {
        ...newSessionData,
        createdAt: serverTimestamp(),
      });
      // Notify admin of new suggestion
      await addDoc(collection(db, "notifications"), {
        toUid: "admin",
        type: "new_suggestion",
        title: newSessionData.title,
        sessionId: docRef.id,
        fromUid: user.uid,
        fromEmail: user.email,
        message: `📋 New session suggestion: "${newSessionData.title}" by ${user.email}`,
        read: false,
        createdAt: serverTimestamp(),
      });
      await reloadSessions();
      setSuggestForm({ ...EMPTY_FORM, reason: "" });
    } catch (e) { 
      toast.error("Failed to submit suggestion."); 
      setSessions(prev => prev.filter(s => s.id !== tempId));
    }
    setIsSubmitting(false);
  };

  // ── Admin: create session directly ──
  const handleAdminCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "sessions"), {
        title: adminForm.title.toUpperCase(),
        category: adminForm.category,
        date: adminForm.date.toUpperCase(),
        time: adminForm.time,
        location: adminForm.location.toUpperCase(),
        totalSpots: Number(adminForm.totalSpots),
        currentRegistrations: 0,
        status: "open",
        approval: "approved",
        createdAt: serverTimestamp(),
      });
      await reloadSessions();
      setIsCreateOpen(false);
      setAdminForm({ ...EMPTY_FORM });
      toast.success("Session created successfully.");
    } catch (e) { toast.error("Failed to create session."); }
    setIsSubmitting(false);
  };



  // ── Admin: reject/delete ──
  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setIsDeleteModalOpen(false);
    
    // Optimistic UI
    const restoredSessions = [...sessions];
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success("Session removed.");

    try {
      await deleteDoc(doc(db, "sessions", id));
      await reloadSessions();
    } catch (e) { 
      toast.error("Failed to delete session.");
      setSessions(restoredSessions);
    }
    setDeleteTargetId(null);
  };

  // ── Admin: edit session ──
  const handleOpenEdit = (session: Session) => {
    setEditingSession(session);
    setAdminForm({
      title: session.title,
      category: session.category,
      date: session.date,
      time: session.time,
      location: session.location,
      totalSpots: session.totalSpots,
    });
    setIsEditOpen(true);
  };

  const handleAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession || isSubmitting) return;
    setIsSubmitting(true);

    const updatedData = {
      title: adminForm.title.toUpperCase(),
      category: adminForm.category,
      date: adminForm.date.toUpperCase(),
      time: adminForm.time,
      location: adminForm.location.toUpperCase(),
      totalSpots: Number(adminForm.totalSpots),
    };

    // Optimistic UI
    const restoredSessions = [...sessions];
    setSessions(prev => 
      prev.map(s => s.id === editingSession.id ? { ...s, ...updatedData } : s)
    );
    setIsEditOpen(false);
    toast.success("Session updated.");

    try {
      await updateDoc(doc(db, "sessions", editingSession.id), {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
      setEditingSession(null);
      await reloadSessions();
    } catch (e) {
      toast.error("Failed to update session.");
      setSessions(restoredSessions);
    }
    setIsSubmitting(false);
  };

  // ── Derived data ──
  const visibleSessions = sessions.filter(s => s.approval === "approved");

  const filteredSessions = visibleSessions.filter(s =>
    activeTab === "ALL" ? true : categoryToTab[s.category] === activeTab
  ).sort((a, b) => {
    // Attempt standard JS date parse on "MAY 14, 2025" format
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (isNaN(timeA) || isNaN(timeB)) return 0; // fallback if invalid string format
    return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
  });



  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-primary/30 pb-20">

      {/* ── Suggest Session Modal (members) ── */}
      {isSuggestOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-md p-6 md:p-10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsSuggestOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"><X size={22} /></button>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-6">SUGGEST A SESSION</h2>
            <form onSubmit={handleSuggest} className="flex flex-col gap-4">
              <SessionFormFields form={suggestForm} setForm={(f: any) => setSuggestForm({ ...f, reason: suggestForm.reason })} />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Why this session? (optional)</label>
                <textarea rows={3} value={suggestForm.reason} onChange={e => setSuggestForm({ ...suggestForm, reason: e.target.value })}
                  placeholder="Tell the admin why this session would be great..." className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none" />
              </div>
              <button disabled={isSubmitting} type="submit"
                className="mt-2 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-500">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "SUBMIT SUGGESTION"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Admin: Create Session Modal ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsCreateOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">CREATE SESSION</h2>
            <form onSubmit={handleAdminCreate} className="flex flex-col gap-4">
              <SessionFormFields form={adminForm} setForm={setAdminForm} />
              <button disabled={isSubmitting} type="submit"
                className="mt-2 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-500">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "CREATE SESSION"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Admin: Edit Session Modal ── */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">EDIT SESSION</h2>
            <form onSubmit={handleAdminEdit} className="flex flex-col gap-4">
              <SessionFormFields form={adminForm} setForm={setAdminForm} />
              <button disabled={isSubmitting} type="submit"
                className="mt-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-500">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "SAVE CHANGES"}
              </button>
            </form>
          </div>
        </div>
      )}



      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-24 md:pt-32 pb-8 md:pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="font-black tracking-tighter text-white leading-[0.9] uppercase" style={{ fontSize: 'clamp(2.5rem, 10vw, 6rem)' }}>{t.games.heroTitle}</h1>
            <p className="mt-4 text-gray-400 max-w-md text-sm md:text-base leading-relaxed px-1">{t.games.heroDesc}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {isAdmin && (
              <button
                onClick={() => { setAdminForm({ ...EMPTY_FORM }); setIsCreateOpen(true); }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-4 rounded-full text-[11px] font-black tracking-widest transition-all duration-500 shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary)] whitespace-nowrap uppercase w-full sm:w-auto justify-center"
              >
                <Plus size={16} strokeWidth={3} />
                CREATE SESSION
              </button>
            )}
            {isLoggedIn && !isAdmin && (
              <button
                onClick={() => setIsSuggestOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-4 rounded-full text-[11px] font-black tracking-widest transition-all duration-500 shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary)] whitespace-nowrap uppercase w-full sm:w-auto justify-center"
              >
                <Plus size={16} strokeWidth={3} />
                {t.games.proposeEvent}
              </button>
            )}
          </div>
        </div>
      </section>


      {/* ── Filters ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] md:text-[11px] font-black tracking-widest uppercase transition-all duration-500 ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-[var(--shadow-primary)]"
                    : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {tab === "ALL" ? t.games.allPlatforms : tab === "VIDEO GAMES" ? t.games.consoleTab : tab === "BOARD GAMES" ? t.games.tabletopTab : "TOURNAMENTS"}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] md:text-[11px] font-black tracking-widest uppercase transition-all duration-500 bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 whitespace-nowrap w-fit self-end md:self-auto"
          >
            SORT BY DATE: {sortOrder === "desc" ? "NEWEST" : "OLDEST"}
            <span className={`transition-transform duration-300 ${sortOrder === "asc" ? "rotate-180" : ""}`}>↓</span>
          </button>
        </div>
      </section>

      {/* ── Cards Grid ── */}
      <section className="max-w-7xl mx-auto w-full px-6">
        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 size={32} className="text-primary animate-spin" /></div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-24 text-gray-600 font-bold tracking-widest text-sm uppercase">
            {t.games.noGamesMatch}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredSessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                isLoadingId={loadingId}
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                isRegistered={userRegistrations.includes(s.id)}
                onRegister={handleRegister}
                onUnregister={handleUnregister}
                onApprove={handleApprove}
                onDelete={handleDelete}
                onEdit={handleOpenEdit}
                onViewAttendees={handleViewAttendees}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Locked CTA (hidden when logged in) ── */}
      {!isLoggedIn && (
        <section className="max-w-7xl mx-auto w-full px-6 mt-20">
          <div className={`relative rounded-3xl border border-primary/20 bg-gradient-to-b ${isIceTheme ? 'from-[#0f172a] to-[#020617]' : 'from-[#1a0a0a] to-[#0f0808]'} p-16 md:p-24 text-center overflow-hidden shadow-[var(--shadow-primary)]`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Lock size={28} className="text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">{t.games.loginRequired}</h2>
              <p className="text-gray-400 max-w-sm text-sm md:text-base leading-relaxed">{t.games.loginRequiredDesc}</p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <button onClick={() => router.push("/register")}
                  className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-500 shadow-[var(--shadow-primary)]">
                  {t.auth.registerHere}
                </button>
                <button onClick={() => router.push("/register")}
                  className="bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white/70 hover:text-white px-8 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-500">
                  {t.auth.loginHere}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Attendees Modal ── */}
      {isAttendeesOpen && activeSessionForAttendees && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-3xl p-8 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <button onClick={() => { setIsAttendeesOpen(false); setActiveSessionForAttendees(null); }} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">ATTENDEE LIST</h2>
            <p className="text-amber-500/70 text-[10px] uppercase font-black tracking-widest mb-6">{activeSessionForAttendees?.title}</p>
            
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {attendees.length === 0 ? (
                <div className="py-12 text-center text-gray-600 font-bold uppercase tracking-widest text-[10px]">No one registered yet.</div>
              ) : (
                attendees.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 overflow-hidden relative">
                    <div className="flex flex-col">
                      <span className="text-white font-black text-sm uppercase tracking-tight">{a.userGamerTag}</span>
                      <span className="text-gray-500 text-[10px] tracking-widest">{a.userEmail}</span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                      <ShieldCheck size={14} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Unregistration Justification Modal ── */}
      {isUnregisterOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
             <button onClick={() => setIsUnregisterOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
             
             <div className="flex flex-col items-center text-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                 <AlertCircle size={32} />
               </div>
               
               <div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Wait, Commander!</h2>
                 <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed px-4">
                   Leaving so soon? Please provide a reason to help us manage the roster.
                 </p>
               </div>

               <form onSubmit={confirmUnregister} className="w-full flex flex-col gap-5 mt-4">
                 <textarea 
                   required
                   autoFocus
                   rows={3}
                   value={unregisterReason}
                   onChange={(e) => setUnregisterReason(e.target.value)}
                   placeholder="Why are you unregistering? (e.g., Schedule conflict)"
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm focus:outline-none focus:border-primary/50 transition-all resize-none shadow-inner font-medium"
                 />
                 
                 <div className="flex flex-col gap-3">
                   <button 
                    disabled={isUnregistering || !unregisterReason.trim()}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_0_30px_-5px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
                   >
                     {isUnregistering ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                     {isUnregistering ? "PROCESSING..." : "CONFIRM ABANDON"}
                   </button>
                   <button 
                    type="button"
                    onClick={() => setIsUnregisterOpen(false)}
                    className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/5"
                   >
                     STAY IN THE FIGHT
                   </button>
                 </div>
               </form>
             </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="ERASE SESSION?"
        description="This action is irreversible. The session data will be permanently purged from the mainframe."
      />
    </div>
  );
}
