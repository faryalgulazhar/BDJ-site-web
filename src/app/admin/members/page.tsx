"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { callSetAdminStatus } from "@/lib/adminFunctions";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  ChevronLeft, 
  UserCheck, 
  UserX, 
  Loader2, 
  Users,
  RefreshCw,
  Crown
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface MemberItem {
  uid: string;
  legalName: string;
  username: string;
  email: string;
  photoURL?: string | null;
  isAdmin: boolean;
  superAdmin: boolean;
  role?: string;
  createdAt?: Date | null;
}

export default function AdminMembersPage() {
  const router = useRouter();
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);

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

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const items: MemberItem[] = await Promise.all(
        snap.docs.map(async (d) => {
          const privData = d.data();
          let username = privData.gamerTag || "—";
          let photoURL = privData.photoURL || null;

          try {
            const pubSnap = await getDoc(doc(db, "users", d.id, "public", "profile"));
            if (pubSnap.exists()) {
              const pubData = pubSnap.data();
              if (pubData.username) username = pubData.username;
              if (pubData.photoURL !== undefined) photoURL = pubData.photoURL;
            }
          } catch (e) {
            console.error(`Error resolving public profile for ${d.id}:`, e);
          }

          let createdAt: Date | null = null;
          if (privData.createdAt?.toDate) {
            createdAt = privData.createdAt.toDate();
          }

          return {
            uid: d.id,
            legalName: privData.legalName || "—",
            username,
            email: privData.email || "—",
            photoURL,
            isAdmin: privData.isAdmin === true,
            superAdmin: privData.superAdmin === true,
            role: privData.role || "Member",
            createdAt,
          };
        })
      );

      // Sort: superAdmins first, then admins, then by name
      items.sort((a, b) => {
        if (a.superAdmin && !b.superAdmin) return -1;
        if (!a.superAdmin && b.superAdmin) return 1;
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return a.legalName.localeCompare(b.legalName);
      });

      setMembers(items);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      toast.error("Failed to load members list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchMembers();
    }
  }, [user, isAdmin]);

  const handleAdminToggle = async (targetMember: MemberItem, makeAdmin: boolean) => {
    if (targetMember.superAdmin) {
      toast.error("Cannot modify superAdmin privileges.");
      return;
    }

    if (!makeAdmin && !isSuperAdmin) {
      toast.error("Permission denied", {
        description: "Only SuperAdmins can demote an admin.",
      });
      return;
    }

    const actionText = makeAdmin ? "promote to Admin" : "remove Admin status from";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${targetMember.legalName} (@${targetMember.username})?`
    );
    if (!confirmed) return;

    setActionLoadingUid(targetMember.uid);
    try {
      await callSetAdminStatus(targetMember.uid, makeAdmin);
      toast.success(
        makeAdmin
          ? `${targetMember.legalName} is now an Admin.`
          : `Admin access removed for ${targetMember.legalName}.`
      );

      // Optimistic update
      setMembers((prev) =>
        prev.map((m) => (m.uid === targetMember.uid ? { ...m, isAdmin: makeAdmin } : m))
      );
    } catch (err: any) {
      console.error("Error setting admin status:", err);
      const msg = err?.message || err?.details || "Failed to update admin status.";
      toast.error("Operation failed", { description: msg });
    } finally {
      setActionLoadingUid(null);
    }
  };

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      return (
        search === "" ||
        m.legalName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    });
  }, [members, search]);

  const adminCount = useMemo(() => members.filter((m) => m.isAdmin || m.superAdmin).length, [members]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#0A0E1A]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
          Loading Members Directory...
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
              href="/admin/attendance"
              className="text-[11px] font-black tracking-widest uppercase px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all border border-white/10"
            >
              Attendance Logs
            </Link>
            <button
              onClick={fetchMembers}
              title="Refresh list"
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
              <Shield size={12} />
              Access Control
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
              Member Directory
            </h1>
            <p className="text-gray-400 text-sm mt-2 max-w-xl">
              Manage member roles and administrative access. Changes are securely executed via server-side verification.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0D1222] border border-white/10 px-5 py-3 rounded-2xl">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Members</p>
              <p className="text-2xl font-black text-white">{members.length}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admins</p>
              <p className="text-2xl font-black text-primary">{adminCount}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by legal name, username, or email..."
            className="w-full bg-[#0D1222] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-gray-500 font-medium focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-[#0D1222] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Legal Name
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Username
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Access Level
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-gray-500 font-medium">
                      No members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => {
                    const isSelf = user?.uid === m.uid;
                    const isRowBusy = actionLoadingUid === m.uid;

                    return (
                      <tr key={m.uid} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {m.photoURL ? (
                                <Image
                                  src={m.photoURL}
                                  alt={m.username}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="font-black text-sm text-gray-400">
                                  {m.legalName.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm flex items-center gap-2">
                                {m.legalName}
                                {isSelf && (
                                  <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-black uppercase">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {m.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-bold">
                            @{m.username}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          {m.superAdmin ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-[10px] uppercase tracking-wider">
                              <Crown size={12} />
                              Super Admin
                            </span>
                          ) : m.isAdmin ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-black text-[10px] uppercase tracking-wider">
                              <ShieldCheck size={12} />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                              Member
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          {m.superAdmin ? (
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                              Protected
                            </span>
                          ) : m.isAdmin ? (
                            <button
                              onClick={() => handleAdminToggle(m, false)}
                              disabled={isRowBusy || !isSuperAdmin}
                              title={!isSuperAdmin ? "Only SuperAdmins can demote admins" : "Remove admin privileges"}
                              className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl font-black text-[10px] tracking-wider uppercase transition-all"
                            >
                              {isRowBusy ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <UserX size={12} />
                              )}
                              Remove Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAdminToggle(m, true)}
                              disabled={isRowBusy}
                              className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl font-black text-[10px] tracking-wider uppercase transition-all"
                            >
                              {isRowBusy ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <UserCheck size={12} />
                              )}
                              Make Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
