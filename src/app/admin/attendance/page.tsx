"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Download, 
  Search, 
  ChevronLeft, 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Loader2,
  FileSpreadsheet,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  uid: string;
  legalName: string;
  username: string;
  email: string;
  eventId: string;
  scannedAt: Date | null;
}

export default function AdminAttendancePage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  // Route guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (!isAdmin) {
        router.replace("/");
      }
    }
  }, [user, isAdmin, authLoading, router]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "attendance"), orderBy("scannedAt", "desc"));
      const snap = await getDocs(q);

      // Cache user lookups to avoid duplicate fetches for repeat scans
      const userCache: Record<string, { legalName: string; username: string; email: string }> = {};

      const items: AttendanceRecord[] = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const uid = data.uid;

          if (!userCache[uid]) {
            let legalName = "—";
            let username = "—";
            let email = "—";

            try {
              // Private doc lookup (admin-readable)
              const privSnap = await getDoc(doc(db, "users", uid));
              if (privSnap.exists()) {
                const privData = privSnap.data();
                legalName = privData.legalName || "—";
                email = privData.email || "—";
                username = privData.gamerTag || "—";
              }

              // Public sub-doc lookup for canonical username
              const pubSnap = await getDoc(doc(db, "users", uid, "public", "profile"));
              if (pubSnap.exists()) {
                const pubData = pubSnap.data();
                if (pubData.username) username = pubData.username;
              }
            } catch (err) {
              console.error(`Error resolving user ${uid}:`, err);
            }

            userCache[uid] = { legalName, username, email };
          }

          let scannedAt: Date | null = null;
          if (data.scannedAt?.toDate) {
            scannedAt = data.scannedAt.toDate();
          } else if (data.scannedAt?.seconds) {
            scannedAt = new Date(data.scannedAt.seconds * 1000);
          } else if (data.scannedAt) {
            scannedAt = new Date(data.scannedAt);
          }

          return {
            id: d.id,
            uid,
            legalName: userCache[uid].legalName,
            username: userCache[uid].username,
            email: userCache[uid].email,
            eventId: data.eventId || "General Check-in",
            scannedAt,
          };
        })
      );

      setRecords(items);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      toast.error("Failed to load attendance logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchAttendance();
    }
  }, [user, isAdmin]);

  // Unique event IDs for filter dropdown
  const uniqueEvents = useMemo(() => {
    const set = new Set(records.map((r) => r.eventId));
    return Array.from(set);
  }, [records]);

  // Filtered records
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        search === "" ||
        r.legalName.toLowerCase().includes(search.toLowerCase()) ||
        r.username.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase()) ||
        r.eventId.toLowerCase().includes(search.toLowerCase());

      const matchEvent = eventFilter === "all" || r.eventId === eventFilter;

      return matchSearch && matchEvent;
    });
  }, [records, search, eventFilter]);

  // CSV Export
  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("No records to export.");
      return;
    }

    const headers = ["Legal Name", "Public Username", "Email", "Event ID", "Date", "Time", "User ID"];
    const rows = filtered.map((r) => [
      `"${(r.legalName || "").replace(/"/g, '""')}"`,
      `"${(r.username || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      `"${(r.eventId || "").replace(/"/g, '""')}"`,
      r.scannedAt ? r.scannedAt.toLocaleDateString("en-CA") : "",
      r.scannedAt ? r.scannedAt.toLocaleTimeString("en-GB") : "",
      `"${r.uid}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    // UTF-8 BOM so Excel opens accented French characters properly
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `bdj-attendance-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} attendance records to CSV!`);
  };

  // Stats
  const uniqueAttendees = useMemo(() => new Set(records.map((r) => r.uid)).size, [records]);
  const todayScans = useMemo(() => {
    const today = new Date().toDateString();
    return records.filter((r) => r.scannedAt && r.scannedAt.toDateString() === today).length;
  }, [records]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#0A0E1A]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
          Loading Attendance Records...
        </p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#070A12] text-white pt-24 pb-20 px-4 md:px-8 selection:bg-primary/30">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Top navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/members"
              className="text-[11px] font-black tracking-widest uppercase px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all border border-white/10"
            >
              Manage Members
            </Link>
            <button
              onClick={fetchAttendance}
              title="Refresh logs"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest uppercase mb-3">
              <Calendar size={12} />
              Attendance Management
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
              Event Attendance
            </h1>
            <p className="text-gray-400 text-sm mt-2 max-w-xl">
              Official roll call records. Verified legal names are kept confidential for administrative and safety records.
            </p>
          </div>

          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_30px_-5px_rgba(255,77,46,0.3)] hover:shadow-[0_0_40px_-3px_rgba(255,77,46,0.5)] self-start md:self-auto"
          >
            <Download size={16} />
            Export CSV ({filtered.length})
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0D1222] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Scans</p>
              <p className="text-3xl font-black text-white mt-1">{records.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileSpreadsheet size={22} />
            </div>
          </div>

          <div className="bg-[#0D1222] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unique Members</p>
              <p className="text-3xl font-black text-white mt-1">{uniqueAttendees}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-[#0D1222] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scanned Today</p>
              <p className="text-3xl font-black text-white mt-1">{todayScans}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by legal name, username, email, or event..."
              className="w-full bg-[#0D1222] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-gray-500 font-medium focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="bg-[#0D1222] border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-white font-medium focus:outline-none focus:border-primary/50 transition-colors"
          >
            <option value="all">All Events ({records.length})</option>
            {uniqueEvents.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#0D1222] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Legal Name (Confidential)
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Public Username
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Event
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-gray-500 font-medium">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => (
                    <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">
                            {record.legalName}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {record.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold">
                          @{record.username}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 text-gray-300 font-mono text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                          {record.eventId}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 font-mono text-[11px]">
                        {record.scannedAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-500" />
                            <span>
                              {record.scannedAt.toLocaleDateString("en-CA")}{" "}
                              {record.scannedAt.toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="py-3 px-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[11px] text-gray-500">
              <span>Showing {filtered.length} of {records.length} records</span>
              <span>CSV downloads include full user IDs and accurate timestamps</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
