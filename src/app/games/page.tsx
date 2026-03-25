"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
  "VIDEO GAME": "bg-[#FF5F5F]/20 text-[#FF5F5F] border border-[#FF5F5F]/40",
  "BOARD GAME": "bg-amber-500/20 text-amber-400 border border-amber-500/40",
  TOURNAMENT: "bg-violet-500/20 text-violet-400 border border-violet-500/40",
};

const ADMIN_EMAIL = "admin@bdj-karukera.com";

// Default seed sessions so there's always content
const SEED_SESSIONS: Omit<Session, "id">[] = [
  { title: "TEKKEN 8 CLASH", category: "VIDEO GAME", date: "MAY 14, 2025", time: "19:00 – 22:00", totalSpots: 10, currentRegistrations: 4, status: "open", approval: "approved" },
  { title: "DUNE IMPERIUM", category: "BOARD GAME", date: "MAY 15, 2025", time: "18:30 – 23:00", totalSpots: 5, currentRegistrations: 3, status: "open", approval: "approved" },
  { title: "STREET FIGHTER VI", category: "TOURNAMENT", date: "MAY 12, 2025", time: "20:00 – 00:00", totalSpots: 8, currentRegistrations: 8, status: "full", approval: "approved" },
  { title: "EA FC 25 LEAGUE", category: "VIDEO GAME", date: "MAY 18, 2025", time: "17:00 – 20:00", totalSpots: 8, currentRegistrations: 4, status: "open", approval: "approved" },
  { title: "MARIO KART CUP", category: "TOURNAMENT", date: "MAY 20, 2025", time: "19:00 – 23:00", totalSpots: 16, currentRegistrations: 15, status: "open", approval: "approved" },
];

// ─────────────────────────────────────────────
// Session Card
// ─────────────────────────────────────────────
interface CardProps {
  session: Session;
  isLoadingId: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onRegister: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (session: Session) => void;
}

function SessionCard({ session, isLoadingId, isLoggedIn, isAdmin, onRegister, onDelete, onEdit }: CardProps) {
  const { t } = useLanguage();
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
      {/* Admin controls */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-1.5 z-10">
          <button
            onClick={() => onEdit(session)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-blue-500/30 text-white/50 hover:text-blue-400 transition-all"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={() => onDelete(session.id)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/30 text-white/50 hover:text-red-400 transition-all"
          >
            <Trash2 size={11} />
          </button>
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
        </div>
        {session.suggestedByEmail && (
          <span className="text-[9px] text-gray-600 uppercase tracking-widest">suggested by {session.suggestedByEmail}</span>
        )}
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
        {isLoadingId === session.id ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isRegistered ? (
          <><CheckCircle size={14} />{t.games.registeredBadge}</>
        ) : (
          t.games.registerTrigger
        )}
      </button>

      {!isLoggedIn && !isFull && !isRegistered && (
        <p className="text-center text-[10px] text-white/20 -mt-2 font-medium">{t.games.loginRequiredDesc}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Pending Card (Admin view)
// ─────────────────────────────────────────────
function PendingCard({ session, onApprove, onReject, onMessage }: {
  session: Session;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMessage: (session: Session) => void;
}) {
  return (
    <div className="bg-[#0f172a] border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_0_20px_-10px_#f59e0b]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase ${categoryColors[session.category]} mb-3 inline-block`}>
            {session.category}
          </span>
          <h4 className="text-base font-black text-white tracking-tight">{session.title}</h4>
          <p className="text-[11px] text-gray-500 mt-1">{session.date} · {session.time} · {session.totalSpots} spots</p>
          {session.suggestedByEmail && (
            <p className="text-[10px] text-amber-500/70 mt-1 uppercase tracking-widest">by {session.suggestedByEmail}</p>
          )}
        </div>
        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full font-black uppercase tracking-widest whitespace-nowrap">PENDING</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onApprove(session.id)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/15 hover:bg-green-500/30 text-green-400 border border-green-500/30 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
        >
          <ShieldCheck size={13} /> APPROVE
        </button>
        <button
          onClick={() => onMessage(session)}
          className="flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
        >
          <MessageSquare size={13} />
        </button>
        <button
          onClick={() => onReject(session.id)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
        >
          <Trash2 size={13} /> REJECT
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
const EMPTY_FORM = { title: "", category: "VIDEO GAME" as GameCategory, date: "", time: "", totalSpots: 8 };

export default function GamesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isLoggedIn = !!user;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Modals
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messaging
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Session | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Forms
  const [suggestForm, setSuggestForm] = useState({ ...EMPTY_FORM, reason: "" });
  const [adminForm, setAdminForm] = useState({ ...EMPTY_FORM });

  // ── Load sessions ──
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "sessions"), orderBy("createdAt", "desc")));
        if (snap.empty) {
          // seed initial data
          for (const s of SEED_SESSIONS) {
            await addDoc(collection(db, "sessions"), { ...s, createdAt: serverTimestamp() });
          }
          // reload
          const snap2 = await getDocs(query(collection(db, "sessions"), orderBy("createdAt", "desc")));
          setSessions(snap2.docs.map(d => ({ id: d.id, ...d.data() } as Session)));
        } else {
          setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session)));
        }
      } catch (e) { console.error(e); }
      setIsLoading(false);
    };
    load();
  }, []);

  const reloadSessions = async () => {
    const snap = await getDocs(query(collection(db, "sessions"), orderBy("createdAt", "desc")));
    setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session)));
  };

  // ── Admin: send notification message to suggester ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTarget?.suggestedBy || !messageText.trim()) return;
    setIsSendingMsg(true);
    try {
      console.log("NOTIF DEBUG: Sending notification to:", messageTarget.suggestedBy, "Message:", messageText.trim());
      await addDoc(collection(db, "notifications"), {
        toUid: messageTarget.suggestedBy,
        toEmail: messageTarget.suggestedByEmail,
        sessionTitle: messageTarget.title,
        message: messageText.trim(),
        read: false,
        createdAt: serverTimestamp(),
      });
      setIsMessageOpen(false);
      setMessageTarget(null);
      setMessageText("");
      toast.success("Message sent to " + messageTarget.suggestedByEmail);
    } catch (e) { toast.error("Failed to send message."); }
    setIsSendingMsg(false);
  };

  // ── Register ──
  const handleRegister = useCallback((id: string) => {
    if (!isLoggedIn) { router.push("/register"); return; }
    const session = sessions.find(s => s.id === id);
    if (!session || session.status !== "open") return;
    setLoadingId(id);
    setTimeout(() => {
      setSessions(prev => prev.map(s => {
        if (s.id !== id) return s;
        const newReg = s.currentRegistrations + 1;
        return { ...s, currentRegistrations: newReg, status: newReg >= s.totalSpots ? "full" : "registered" };
      }));
      setLoadingId(null);
      toast.success(`Registered for ${session.title}!`, { description: `${session.date} · ${session.time}` });
    }, 500);
  }, [isLoggedIn, sessions, router]);

  // ── Suggest session (member) ──
  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "sessions"), {
        title: suggestForm.title.toUpperCase(),
        category: suggestForm.category,
        date: suggestForm.date.toUpperCase(),
        time: suggestForm.time,
        totalSpots: Number(suggestForm.totalSpots),
        currentRegistrations: 0,
        status: "open",
        approval: "pending",
        suggestedBy: user.uid,
        suggestedByEmail: user.email,
        createdAt: serverTimestamp(),
      });
      await reloadSessions();
      setIsSuggestOpen(false);
      setSuggestForm({ ...EMPTY_FORM, reason: "" });
      toast.success("Session suggested! Waiting for admin approval.");
    } catch (e) { toast.error("Failed to submit suggestion."); }
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

  // ── Admin: approve pending ──
  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, "sessions", id), { approval: "approved" });
    await reloadSessions();
    toast.success("Session approved!");
  };

  // ── Admin: reject/delete ──
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session permanently?")) return;
    await deleteDoc(doc(db, "sessions", id));
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success("Session removed.");
  };

  // ── Admin: edit session ──
  const handleOpenEdit = (session: Session) => {
    setEditingSession(session);
    setAdminForm({
      title: session.title,
      category: session.category,
      date: session.date,
      time: session.time,
      totalSpots: session.totalSpots,
    });
    setIsEditOpen(true);
  };

  const handleAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "sessions", editingSession.id), {
        title: adminForm.title.toUpperCase(),
        category: adminForm.category,
        date: adminForm.date.toUpperCase(),
        time: adminForm.time,
        totalSpots: Number(adminForm.totalSpots),
      });
      await reloadSessions();
      setIsEditOpen(false);
      setEditingSession(null);
      toast.success("Session updated.");
    } catch (e) { toast.error("Failed to update session."); }
    setIsSubmitting(false);
  };

  // ── Derived data ──
  const approvedSessions = sessions.filter(s => s.approval === "approved");
  const pendingSessions = sessions.filter(s => s.approval === "pending");

  const filteredSessions = approvedSessions.filter(s =>
    activeTab === "ALL" ? true : categoryToTab[s.category] === activeTab
  );

  // ─────────────────────────────────────────────
  // Session Form Fields (shared by suggest/create/edit)
  // ─────────────────────────────────────────────
  const SessionFormFields = ({ form, setForm }: { form: typeof adminForm; setForm: (f: typeof adminForm) => void }) => (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Session Title</label>
        <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="E.g. TEKKEN 8 TOURNAMENT" className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Category</label>
        <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value as GameCategory })}
          className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors appearance-none">
          <option value="VIDEO GAME">VIDEO GAME</option>
          <option value="BOARD GAME">BOARD GAME</option>
          <option value="TOURNAMENT">TOURNAMENT</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Date</label>
          <input required type="text" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
            placeholder="MAY 20, 2025" className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Time</label>
          <input required type="text" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
            placeholder="19:00 – 22:00" className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Total Spots</label>
        <input required type="number" min="2" max="64" value={form.totalSpots} onChange={e => setForm({ ...form, totalSpots: Number(e.target.value) })}
          className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors" />
      </div>
    </>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-[#FF5F5F]/30 pb-20">

      {/* ── Suggest Session Modal (members) ── */}
      {isSuggestOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsSuggestOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">SUGGEST A SESSION</h2>
            <form onSubmit={handleSuggest} className="flex flex-col gap-4">
              <SessionFormFields form={suggestForm} setForm={(f) => setSuggestForm({ ...f, reason: suggestForm.reason })} />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Why this session? (optional)</label>
                <textarea rows={3} value={suggestForm.reason} onChange={e => setSuggestForm({ ...suggestForm, reason: e.target.value })}
                  placeholder="Tell the admin why this session would be great..." className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-colors resize-none" />
              </div>
              <button disabled={isSubmitting} type="submit"
                className="mt-2 flex items-center justify-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-300">
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
                className="mt-2 flex items-center justify-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-300">
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
                className="mt-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-300">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "SAVE CHANGES"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Admin: Message Compose Modal ── */}
      {isMessageOpen && messageTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl">
            <button onClick={() => setIsMessageOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"><X size={22} /></button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                <MessageSquare size={16} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">MESSAGE MEMBER</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{messageTarget.suggestedByEmail}</p>
              </div>
            </div>
            <p className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 mt-4 mb-6">
              Re: <span className="font-black">{messageTarget.title}</span> suggestion
            </p>
            <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Your message</label>
                <textarea
                  rows={5}
                  required
                  autoFocus
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="E.g. Great suggestion! Your session has been approved and will appear on the games page."
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/40 transition-colors resize-none leading-relaxed"
                />
              </div>
              <button disabled={isSendingMsg} type="submit"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-gray-500 text-white px-6 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-300">
                {isSendingMsg ? <Loader2 size={16} className="animate-spin" /> : <><MessageSquare size={14} /> SEND MESSAGE</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-16 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white leading-none uppercase">{t.games.heroTitle}</h1>
            <p className="mt-4 text-gray-400 max-w-md text-sm md:text-base leading-relaxed">{t.games.heroDesc}</p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 self-start sm:self-auto">
            {isLoggedIn && !isAdmin && (
              <button
                onClick={() => setIsSuggestOpen(true)}
                className="flex items-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-6 py-4 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F] whitespace-nowrap uppercase"
              >
                <Plus size={16} strokeWidth={3} />
                {t.games.proposeEvent}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => { setAdminForm({ ...EMPTY_FORM }); setIsCreateOpen(true); }}
                className="flex items-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-6 py-4 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F] whitespace-nowrap uppercase"
              >
                <Plus size={16} strokeWidth={3} />
                CREATE SESSION
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Admin: Pending Suggestions ── */}
      {isAdmin && pendingSessions.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-6 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck size={18} className="text-amber-400" />
            <h2 className="text-sm font-black tracking-widest text-amber-400 uppercase">
              Pending Suggestions ({pendingSessions.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingSessions.map(s => (
              <PendingCard
                key={s.id}
                session={s}
                onApprove={handleApprove}
                onReject={handleDelete}
                onMessage={(session) => {
                  setMessageTarget(session);
                  setMessageText("");
                  setIsMessageOpen(true);
                }}
              />
            ))}
          </div>
          <div className="border-t border-white/5 my-10" />
        </section>
      )}

      {/* ── Filters ── */}
      <section className="max-w-7xl mx-auto w-full px-6 pb-10">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 ${
                activeTab === tab
                  ? "bg-[#FF5F5F] text-white shadow-[0_0_20px_-5px_#FF5F5F]"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {tab === "ALL" ? t.games.allPlatforms : tab === "VIDEO GAMES" ? t.games.consoleTab : tab === "BOARD GAMES" ? t.games.tabletopTab : "TOURNAMENTS"}
            </button>
          ))}
        </div>
      </section>

      {/* ── Cards Grid ── */}
      <section className="max-w-7xl mx-auto w-full px-6">
        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 size={32} className="text-[#FF5F5F] animate-spin" /></div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-24 text-gray-600 font-bold tracking-widest text-sm uppercase">
            {t.games.noGamesMatch}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                isLoadingId={loadingId}
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                onRegister={handleRegister}
                onDelete={handleDelete}
                onEdit={handleOpenEdit}
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
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">{t.games.loginRequired}</h2>
              <p className="text-gray-400 max-w-sm text-sm md:text-base leading-relaxed">{t.games.loginRequiredDesc}</p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <button onClick={() => router.push("/register")}
                  className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-8 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_-5px_#FF5F5F]">
                  {t.auth.registerHere}
                </button>
                <button onClick={() => router.push("/register")}
                  className="bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white/70 hover:text-white px-8 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300">
                  {t.auth.loginHere}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
