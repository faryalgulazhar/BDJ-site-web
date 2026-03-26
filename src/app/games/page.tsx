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
  AlertCircle,
  MoreVertical,
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
  "VIDEO GAME": "bg-[#FF5F5F]/20 text-[#FF5F5F] border border-[#FF5F5F]/40",
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
        className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-all shadow-inner" 
      />
    </div>
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase px-1">Category</label>
      <select 
        required 
        value={form.category} 
        onChange={e => setForm({ ...form, category: e.target.value as GameCategory })}
        className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-all appearance-none cursor-pointer"
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
        className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-all shadow-inner" 
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
          className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-all shadow-inner" 
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
          className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-all shadow-inner" 
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
        className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#FF5F5F]/50 transition-all shadow-inner font-bold" 
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
  onDelete: (id: string) => void;
  onEdit: (session: Session) => void;
  onViewAttendees: (session: Session) => void;
}

function SessionCard({ session, isLoadingId, isLoggedIn, isAdmin, isRegistered, onRegister, onUnregister, onDelete, onEdit, onViewAttendees }: CardProps) {
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const spotsLeft = session.totalSpots - session.currentRegistrations;
  const isFull = session.status === "full" || spotsLeft <= 0;
  // const isRegistered = session.status === "registered"; // Removing local status check

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
          <span className="flex items-center gap-2 font-black text-[#FF5F5F]/70 uppercase tracking-tighter text-[11px]"><Plus size={12} className="rotate-45" /> {session.location}</span>
        </div>
        {session.suggestedByEmail && (
          <span className="text-[9px] text-gray-600 uppercase tracking-widest">suggested by {session.suggestedByEmail}</span>
        )}
      </div>

      {/* Action button */}
      <div className="flex flex-col gap-2">
        {!isRegistered ? (
          <button
            disabled={isFull}
            onClick={() => onRegister(session.id)}
            className={`w-full py-3 rounded-xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              isFull
                ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                : "bg-[#FF5F5F] hover:bg-[#ff4040] text-white shadow-[0_0_20px_-5px_#FF5F5F] hover:shadow-[0_0_30px_-3px_#FF5F5F]"
            }`}
          >
            {isLoadingId === session.id ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isFull ? (
              t.games.tournamentFull
            ) : (
              t.games.registerTrigger
            )}
          </button>
        ) : (
          <button
            onClick={() => onUnregister(session.id)}
            className="w-full py-3 rounded-xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-300 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-red-500/20 text-green-400 hover:text-red-400 border border-green-500/30 hover:border-red-500/30 group"
          >
            {isLoadingId === session.id ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <CheckCircle size={14} className="group-hover:hidden" />
                <span className="group-hover:hidden">{t.games.registeredBadge}</span>
                <X size={14} className="hidden group-hover:block" />
                <span className="hidden group-hover:block">UNREGISTER</span>
              </>
            )}
          </button>
        )}
      </div>

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
          <p className="text-[11px] text-gray-500 mt-1">{session.date} · {session.time}</p>
          <p className="text-[11px] text-[#FF5F5F]/70 font-black uppercase tracking-widest mt-0.5">{session.location}</p>
          <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">{session.totalSpots} spots</p>
          {session.suggestedByEmail && (
            <p className="text-[10px] text-amber-500/70 mt-1 uppercase tracking-widest">by {session.suggestedByEmail}</p>
          )}
        </div>
        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full font-black uppercase tracking-widest whitespace-nowrap">PENDING</span>
      </div>
      <div className="flex flex-wrap gap-3 items-center mt-2">
        <button
          onClick={() => onApprove(session.id)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/15 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
        >
          <ShieldCheck size={14} /> APPROVE
        </button>
        <button
          onClick={() => onMessage(session)}
          className="flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
          title="Message Suggseter"
        >
          <MessageSquare size={14} />
        </button>
        <button
          onClick={() => onReject(session.id)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
        >
          <Trash2 size={14} /> REJECT
        </button>
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

  // Registrations state
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [activeSessionForAttendees, setActiveSessionForAttendees] = useState<Session | null>(null);

  // Admin: Member messages
  const [memberMessages, setMemberMessages] = useState<any[]>([]);

  // Unregistration
  const [isUnregisterOpen, setIsUnregisterOpen] = useState(false);
  const [unregisterId, setUnregisterId] = useState<string | null>(null);
  const [unregisterReason, setUnregisterReason] = useState("");
  const [isUnregistering, setIsUnregistering] = useState(false);

  // Messaging
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Session | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Admin: Tasks
  const [adminTasks, setAdminTasks] = useState<any[]>([]);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Clock Effect
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isAdmin]);

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

        // Fetch member messages for admin
        if (isAdmin) {
          const msgSnap = await getDocs(query(collection(db, "member_messages"), orderBy("createdAt", "desc")));
          setMemberMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          // Fetch Admin Tasks
          const taskSnap = await getDocs(query(collection(db, "admin_tasks"), orderBy("createdAt", "desc")));
          setAdminTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    if (isAdmin) {
      const msgSnap = await getDocs(query(collection(db, "member_messages"), orderBy("createdAt", "desc")));
      setMemberMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const taskSnap = await getDocs(query(collection(db, "admin_tasks"), orderBy("createdAt", "desc")));
      setAdminTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
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
      await addDoc(collection(db, "sessions"), {
        ...newSessionData,
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

  const handleDismissMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "member_messages", id));
      setMemberMessages(prev => prev.filter(m => m.id !== id));
      toast.success("Message dismissed.");
    } catch (e) { toast.error("Failed to dismiss message."); }
  };

  // ── Admin Tasks Implementation ──
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim() || !user) return;
    setIsAddingTask(true);
    
    // Optimistic UI
    const tempId = "task-" + Date.now();
    const newTask = { id: tempId, content: newTaskContent, completed: false, createdAt: new Date() };
    setAdminTasks(prev => [newTask, ...prev]);
    setNewTaskContent("");

    try {
      const result = await createTaskAction({ content: newTask.content, author: user.email! });
      if (!result.success) throw new Error(result.error);
      await reloadSessions(); // To sync real IDs
    } catch (e) {
      toast.error("Failed to create task");
      setAdminTasks(prev => prev.filter(t => t.id !== tempId));
    }
    setIsAddingTask(false);
  };

  const handleToggleTask = async (id: string, currentStatus: boolean) => {
    const restored = [...adminTasks];
    setAdminTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    
    try {
      const result = await toggleTaskAction(id, !currentStatus);
      if (!result.success) throw new Error(result.error);
    } catch (e) {
      setAdminTasks(restored);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (id: string) => {
    const restored = [...adminTasks];
    setAdminTasks(prev => prev.filter(t => t.id !== id));
    
    try {
      const result = await deleteTaskAction(id);
      if (!result.success) throw new Error(result.error);
    } catch (e) {
      setAdminTasks(restored);
      toast.error("Failed to delete task");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "member_messages", id));
      toast.success("Message deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete message");
    }
  };

  // ── Admin: approve pending ──
  const handleApprove = async (id: string) => {
    // Optimistic UI
    const restoredSessions = [...sessions];
    setSessions(prev => 
      prev.map(s => s.id === id ? { ...s, approval: "approved" as SessionApproval } : s)
    );
    toast.success("Session approved!");

    try {
      const result = await approveSessionAction(id);
      if (!result.success) throw new Error(result.error);
    } catch (e) {
      toast.error("Failed to approve session.");
      setSessions(restoredSessions);
    }
  };

  // ── Admin: reject/delete ──
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session permanently?")) return;
    
    // Optimistic UI
    const restoredSessions = [...sessions];
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success("Session removed.");

    try {
      const result = await deleteSessionAction(id);
      if (!result.success) throw new Error(result.error);
    } catch (e) { 
      toast.error("Failed to delete session.");
      setSessions(restoredSessions);
    }
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
      const result = await updateSessionAction(editingSession.id, updatedData);
      if (!result.success) throw new Error(result.error);
      setEditingSession(null);
      await reloadSessions();
    } catch (e) {
      toast.error("Failed to update session.");
      setSessions(restoredSessions);
    }
    setIsSubmitting(false);
  };

  // ── Derived data ──
  const approvedSessions = sessions.filter(s => s.approval === "approved");
  const pendingSessions = sessions.filter(s => s.approval === "pending");

  const filteredSessions = approvedSessions.filter(s =>
    activeTab === "ALL" ? true : categoryToTab[s.category] === activeTab
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
              <SessionFormFields form={suggestForm} setForm={(f: any) => setSuggestForm({ ...f, reason: suggestForm.reason })} />
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
      <section className="max-w-7xl mx-auto w-full px-6 pt-32 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white leading-none uppercase">{t.games.heroTitle}</h1>
            <p className="mt-4 text-gray-400 max-w-md text-sm md:text-base leading-relaxed">{t.games.heroDesc}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 self-start sm:self-auto">
            {isAdmin && (
              <button
                onClick={() => { setAdminForm({ ...EMPTY_FORM }); setIsCreateOpen(true); }}
                className="flex items-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-6 py-4 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F] whitespace-nowrap uppercase"
              >
                <Plus size={16} strokeWidth={3} />
                CREATE SESSION
              </button>
            )}
            {isLoggedIn && !isAdmin && (
              <button
                onClick={() => setIsSuggestOpen(true)}
                className="flex items-center gap-2 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-6 py-4 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 shadow-[0_0_30px_-5px_#FF5F5F] hover:shadow-[0_0_40px_-3px_#FF5F5F] whitespace-nowrap uppercase"
              >
                <Plus size={16} strokeWidth={3} />
                {t.games.proposeEvent}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Admin Area ── */}
      {isAdmin && (
        <section className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-12">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Admin Area</h1>
              <p className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase">Control Center & Operations</p>
            </div>
            
            {/* Live Synchronized Clock */}
            <div className="bg-black/40 border border-[#FF5F5F]/20 px-8 py-4 rounded-3xl flex flex-col items-center justify-center min-w-[240px] shadow-[inset_0_0_20px_rgba(255,95,95,0.05)]">
               <div className="flex items-center gap-3 text-[#FF5F5F] mb-1">
                 <Clock size={16} className="animate-pulse" />
                 <span className="text-[10px] font-black tracking-[0.3em] uppercase">System Sync</span>
               </div>
               <div className="text-3xl font-black text-white tracking-widest font-mono">
                 {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
               </div>
               <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                 {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
            
            {/* Column 1: Suggestions */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Review Suggestions</h2>
                  <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/20">{pendingSessions.length}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {pendingSessions.length === 0 ? (
                  <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-2xl p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">No pending suggestions</div>
                ) : (
                  pendingSessions.map(s => (
                    <PendingCard 
                      key={s.id} 
                      session={s} 
                      onApprove={handleApprove} 
                      onReject={handleDelete} 
                      onMessage={(s) => { setMessageTarget(s); setIsMessageOpen(true); }} 
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Member Messages */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#FF5F5F] rounded-full" />
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Member Replies</h2>
                  <span className="bg-[#FF5F5F]/10 text-[#FF5F5F] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#FF5F5F]/20">{memberMessages.length}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {memberMessages.length === 0 ? (
                  <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-2xl p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">No messages from members</div>
                ) : (
                  memberMessages.map((m) => (
                    <div key={m.id} className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FF5F5F]/30 transition-all relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#FF5F5F] font-black uppercase tracking-widest">{m.fromEmail?.split('@')[0]}</span>
                          <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">RE: {m.originalSession}</span>
                        </div>
                        <button onClick={() => handleDeleteMessage(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed italic">"{m.content}"</p>
                      <div className="mt-3 flex justify-end">
                         <span className="text-[8px] text-gray-700 font-black uppercase">
                           {m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                         </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Admin Tasks Section */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Admin Tasks</h2>
                  <span className="bg-violet-500/10 text-violet-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-violet-500/20">{adminTasks.length}</span>
                </div>
              </div>

              {/* Task Creation Form */}
              <form onSubmit={handleCreateTask} className="flex gap-3">
                <input 
                  type="text"
                  required
                  value={newTaskContent}
                  onChange={e => setNewTaskContent(e.target.value)}
                  placeholder="What needs to be done?..."
                  className="flex-1 bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all shadow-inner"
                />
                <button 
                  disabled={isAddingTask}
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]"
                >
                  {isAddingTask ? <Loader2 size={14} className="animate-spin" /> : <Plus size={18} />}
                </button>
              </form>

              {/* Tasks List */}
              <div className="flex flex-col gap-3">
                {adminTasks.length === 0 ? (
                  <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-2xl p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">No tasks assigned</div>
                ) : (
                  adminTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                        task.completed 
                          ? "bg-black/20 border-white/5 opacity-50" 
                          : "bg-white/5 border-white/10 hover:border-violet-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <button 
                          onClick={() => handleToggleTask(task.id, task.completed)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            task.completed 
                              ? "bg-violet-500 border-violet-500 text-white" 
                              : "border-white/10 hover:border-violet-500/50"
                          }`}
                        >
                          {task.completed && <CheckCircle size={14} />}
                        </button>
                        <span className={`text-sm font-medium ${task.completed ? "line-through text-gray-500" : "text-white"}`}>
                          {task.content}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
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
                isRegistered={userRegistrations.includes(s.id)}
                onRegister={handleRegister}
                onUnregister={handleUnregister}
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
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-all resize-none shadow-inner font-medium"
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
    </div>
  );
}
