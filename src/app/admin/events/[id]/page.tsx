"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  collection, doc, getDoc, updateDoc, onSnapshot, increment 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Scanner } from "@yudiel/react-qr-scanner";
import { 
  CheckCircle2, AlertTriangle, XCircle, Clock, 
  Camera, X, Users, RefreshCw, Calendar
} from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAIL = "admin@bdj-karukera.com";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  currentRegistrations: number;
  totalSpots: number;
  status: string;
}

interface Registration {
  userId: string;
  name: string;
  status: "pending" | "present" | "late" | "absent";
  timestamp?: any;
}

export default function AdminEventDetailPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"pending" | "present" | "late" | "absent" | "all">("all");
  
  // Scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // Action Modal State
  const [targetReg, setTargetReg] = useState<Registration | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  // Admin Guard
  useEffect(() => {
    if (user === null) { router.replace("/login"); return; }
    if (user && user.email !== ADMIN_EMAIL) { router.replace("/dashboard"); }
  }, [user, router]);

  // Fetch Event Data
  useEffect(() => {
    if (!unwrappedParams.id || !user || user.email !== ADMIN_EMAIL) return;
    
    const fetchEvent = async () => {
      try {
        const snap = await getDoc(doc(db, "events", unwrappedParams.id));
        if (snap.exists()) {
          setEventData({ id: snap.id, ...snap.data() } as EventData);
        } else {
          toast.error("Event not found.");
        }
      } catch (e) {
        toast.error("Error loading event.");
      }
    };
    fetchEvent();

    // Real-time registrations
    const unsub = onSnapshot(collection(db, "events", unwrappedParams.id, "registrations"), (snap) => {
      const regs: Registration[] = [];
      snap.forEach(d => {
        regs.push(d.data() as Registration);
      });
      setRegistrations(regs);
      setLoading(false);
    });

    return () => unsub();
  }, [unwrappedParams.id, user]);

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedText = detectedCodes[0].rawValue;
      if (scannedText) {
        setIsScannerOpen(false);
        processScan(scannedText);
      }
    }
  };

  const processScan = (scannedText: string) => {
    try {
      // Typically URL looks like https://domain.com/admin/verify?id=USER_ID
      // Or it might be just the USER_ID string.
      let userId = scannedText;
      if (scannedText.includes("?id=")) {
        const url = new URL(scannedText);
        userId = url.searchParams.get("id") || scannedText;
      }

      const reg = registrations.find(r => r.userId === userId);
      if (reg) {
        setTargetReg(reg);
      } else {
        toast.error("This user is NOT registered for this event.");
      }
    } catch (e) {
      toast.error("Invalid QR Code format.");
    }
  };

  const submitStatus = async (newStatus: "present" | "late" | "absent" | "pending", regToUpdate?: Registration) => {
    const reg = regToUpdate || targetReg;
    if (!reg || !eventData) return;
    setIsActioning(true);

    try {
      const givesPoints = (newStatus === "present" || newStatus === "late");
      const hadPoints = (reg.status === "present" || reg.status === "late");

      await updateDoc(doc(db, "events", eventData.id, "registrations", reg.userId), {
        status: newStatus
      });

      if (givesPoints && !hadPoints) {
        await updateDoc(doc(db, "users", reg.userId), {
          activityPoints: increment(1)
        });
      } else if (!givesPoints && hadPoints) {
        await updateDoc(doc(db, "users", reg.userId), {
          activityPoints: increment(-1)
        });
      }

      toast.success(`Marked ${reg.name} as ${newStatus.toUpperCase()}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status.");
    } finally {
      setIsActioning(false);
      setTargetReg(null);
    }
  };

  if (!user || user.email !== ADMIN_EMAIL) return null;

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center min-h-screen">
        <RefreshCw className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  const filteredRegistrations = activeTab === "all" 
    ? registrations 
    : registrations.filter(r => r.status === activeTab);

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full pt-28 mb-10 min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 w-full">
        <div>
          <button onClick={() => router.push("/games")} className="text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-white mb-4 block">&larr; BACK TO SESSIONS</button>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">{eventData?.title || "EVENT"}</h1>
          <div className="flex items-center gap-4 mt-2 text-primary font-bold text-sm tracking-widest">
            <span className="flex items-center gap-1"><Calendar size={14} /> {eventData?.date} {eventData?.time}</span>
            <span>•</span>
            <span className="text-gray-400">{eventData?.location}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all shadow-lg flex items-center gap-2 justify-center"
        >
          <Camera size={18} /> OPEN QR SCANNER
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-gray-500 text-[10px] font-black tracking-widest uppercase mb-2">Total Regs</span>
          <span className="text-3xl font-black text-white">{registrations.length} <span className="text-sm text-gray-500">/ {eventData?.totalSpots || 0}</span></span>
        </div>
        <div className="bg-[#121212] border border-green-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-green-500 text-[10px] font-black tracking-widest uppercase mb-2">Present</span>
          <span className="text-3xl font-black text-green-500">{registrations.filter(r => r.status === "present").length}</span>
        </div>
        <div className="bg-[#121212] border border-orange-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-orange-500 text-[10px] font-black tracking-widest uppercase mb-2">Late</span>
          <span className="text-3xl font-black text-orange-500">{registrations.filter(r => r.status === "late").length}</span>
        </div>
        <div className="bg-[#121212] border border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-red-500 text-[10px] font-black tracking-widest uppercase mb-2">Absent</span>
          <span className="text-3xl font-black text-red-500">{registrations.filter(r => r.status === "absent").length}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
        {[
          { id: "all", label: "ALL" },
          { id: "pending", label: "NOT SCANNED" },
          { id: "present", label: "PRESENT" },
          { id: "late", label: "LATE" },
          { id: "absent", label: "ABSENT" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
              activeTab === tab.id 
                ? "bg-white text-black" 
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div className="flex flex-col gap-3">
        {filteredRegistrations.length === 0 ? (
          <div className="text-center text-gray-500 text-sm font-bold uppercase mt-10">No users found in this category.</div>
        ) : (
          filteredRegistrations.map((reg) => (
            <div key={reg.userId} className="bg-[#121212] border border-white/5 rounded-[1.5rem] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Users className="text-gray-500 p-2 bg-white/5 rounded-full" size={40} />
                <div>
                  <h3 className="font-bold text-white text-sm uppercase">{reg.name}</h3>
                  <div className="text-xs text-gray-500 tracking-wider">ID: {reg.userId.slice(0, 8)}...</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {reg.status === "present" && <span className="bg-green-500/10 text-green-500 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-[90px] justify-center"><CheckCircle2 size={12}/> PRESENT</span>}
                {reg.status === "late" && <span className="bg-orange-500/10 text-orange-500 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-[90px] justify-center"><Clock size={12}/> LATE</span>}
                {reg.status === "absent" && <span className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-[90px] justify-center"><XCircle size={12}/> ABSENT</span>}
                {reg.status === "pending" && <span className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-[90px] justify-center">WAITING</span>}
                
                <div className="flex border border-white/10 rounded-lg overflow-hidden ml-2">
                  <button 
                    disabled={isActioning}
                    onClick={() => submitStatus("present", reg)}
                    title="Mark Present"
                    className="bg-green-500/5 hover:bg-green-500/20 text-green-500 px-3 py-2 text-[10px] font-black tracking-widest transition-all"
                  >
                    P
                  </button>
                  <button 
                    disabled={isActioning}
                    onClick={() => submitStatus("late", reg)}
                    title="Mark Late"
                    className="bg-orange-500/5 hover:bg-orange-500/20 text-orange-500 border-l border-white/10 px-3 py-2 text-[10px] font-black tracking-widest transition-all"
                  >
                    L
                  </button>
                  <button 
                    disabled={isActioning}
                    onClick={() => submitStatus("absent", reg)}
                    title="Mark Absent"
                    className="bg-red-500/5 hover:bg-red-500/20 text-red-500 border-l border-white/10 px-3 py-2 text-[10px] font-black tracking-widest transition-all"
                  >
                    A
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>


      {/* ── QR Scanner Modal ── */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 className="text-xl font-black text-white tracking-widest uppercase">SCAN TICKET</h2>
            <button onClick={() => setIsScannerOpen(false)} className="bg-white/10 rounded-full p-2"><X className="text-white" /></button>
          </div>
          <div className="flex-1 w-full bg-black flex flex-col justify-center items-center overflow-hidden relative">
            <div className="w-[80vw] h-[80vw] max-w-[400px] max-h-[400px] border-[4px] border-primary rounded-[2rem] overflow-hidden relative shadow-[0_0_50px_var(--shadow-primary)]">
               <Scanner onScan={handleScan} />
            </div>
            <p className="mt-10 text-gray-400 text-xs font-bold tracking-widest uppercase text-center max-w-[250px]">Position user's QR code completely inside the frame.</p>
          </div>
        </div>
      )}

      {/* ── Status Change Modal ── */}
      {targetReg && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121212] border border-white/10 rounded-[2rem] w-full max-w-sm p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
               <button onClick={() => setTargetReg(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20}/></button>
               
               <h3 className="font-black text-xl text-white uppercase tracking-tighter mb-2">{targetReg.name}</h3>
               <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-8">Update Attendance</p>
               
               <div className="flex flex-col gap-3">
                 <button disabled={isActioning} onClick={() => submitStatus("present")} className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl font-black text-xs tracking-widest uppercase flex justify-between items-center transition-colors">
                   <span>Mark Present</span> <CheckCircle2 size={16} />
                 </button>
                 <button disabled={isActioning} onClick={() => submitStatus("late")} className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-xl font-black text-xs tracking-widest uppercase flex justify-between items-center transition-colors">
                   <span>Mark Late</span> <Clock size={16} />
                 </button>
                 <button disabled={isActioning} onClick={() => submitStatus("absent")} className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-xl font-black text-xs tracking-widest uppercase flex justify-between items-center transition-colors mb-2">
                   <span>Mark Absent</span> <XCircle size={16} />
                 </button>

                 <button disabled={isActioning} onClick={() => submitStatus("pending")} className="bg-transparent border border-white/10 hover:bg-white/5 text-gray-400 p-4 rounded-xl font-black text-[10px] tracking-widest uppercase transition-colors">
                   Reset (Pending)
                 </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
