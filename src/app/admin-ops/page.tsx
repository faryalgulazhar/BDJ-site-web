"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  Clock,
  CheckCircle,
  Loader2,
  X,
  ShieldCheck,
  Trash2,
  MessageSquare,
  Plus,
  Lock
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  deleteSessionAction, 
  approveSessionAction, 
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction 
} from "@/app/games/actions";

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
  eventTimestamp?: any;
  totalSpots: number;
  currentRegistrations: number;
  status: RegistrationStatus;
  approval: SessionApproval;
  suggestedBy?: string;
  suggestedByEmail?: string;
  createdAt?: any;
}

const categoryColors: Record<GameCategory, string> = {
  "VIDEO GAME": "bg-[#FF5F5F]/20 text-[#FF5F5F] border border-[#FF5F5F]/40",
  "BOARD GAME": "bg-amber-500/20 text-amber-400 border border-amber-500/40",
  TOURNAMENT: "bg-violet-500/20 text-violet-400 border border-violet-500/40",
};

const ADMIN_EMAIL = "admin@bdj-karukera.com";

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
export default function AdminOpsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [memberMessages, setMemberMessages] = useState<any[]>([]);
  const [adminTasks, setAdminTasks] = useState<any[]>([]);

  // Messaging state
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Session | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Tasks state
  const [newTaskContent, setNewTaskContent] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Clock Effect
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isAdmin]);

  // Load Data
  const loadData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "sessions"), orderBy("createdAt", "desc")));
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session)));

      const msgSnap = await getDocs(query(collection(db, "member_messages"), orderBy("createdAt", "desc")));
      setMemberMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const taskSnap = await getDocs(query(collection(db, "admin_tasks"), orderBy("createdAt", "desc")));
      setAdminTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user, isAdmin]);

  // ── Handlers ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTarget?.suggestedBy || !messageText.trim()) return;
    setIsSendingMsg(true);
    try {
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim() || !user) return;
    setIsAddingTask(true);
    
    const tempId = "task-" + Date.now();
    const newTask = { id: tempId, content: newTaskContent, completed: false, createdAt: new Date() };
    setAdminTasks(prev => [newTask, ...prev]);
    setNewTaskContent("");

    try {
      const result = await createTaskAction({ content: newTask.content, author: user.email! });
      if (!result.success) throw new Error(result.error);
      await loadData();
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
      setMemberMessages(prev => prev.filter(m => m.id !== id));
      toast.success("Message deleted");
    } catch (e) {
      toast.error("Failed to delete message");
    }
  };

  const handleApprove = async (id: string) => {
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this suggestion permanently?")) return;
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

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center pb-20 mt-32 min-h-screen">
        <Loader2 size={32} className="text-[#FF5F5F] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[80vh]">
        <div className="relative rounded-3xl border border-[#FF5F5F]/20 bg-gradient-to-b from-[#1a0a0a] to-[#0f0808] p-16 md:p-24 text-center overflow-hidden shadow-[inset_0_0_80px_-20px_#FF5F5F22] max-w-2xl w-full">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#FF5F5F]/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FF5F5F]/15 border border-[#FF5F5F]/30 flex items-center justify-center">
              <Lock size={28} className="text-[#FF5F5F]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">UNAUTHORIZED</h2>
            <p className="text-gray-400 max-w-sm text-sm md:text-base leading-relaxed">You need administrator privileges to view this area.</p>
            <button onClick={() => router.push("/")}
              className="mt-4 bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-8 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_-5px_#FF5F5F]">
              BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingSessions = sessions.filter(s => s.approval === "pending");

  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-[#FF5F5F]/30 pb-20">
      
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

      {/* ── Admin Area Content ── */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-12 mt-10">
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
    </div>
  );
}
