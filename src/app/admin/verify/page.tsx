"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  doc, getDoc, addDoc, collection, serverTimestamp,
  getDocs, query, where, setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { CheckCircle2, AlertTriangle, XCircle, UserPlus, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type State = "loading" | "valid" | "inactive" | "not_found";

interface MemberData {
  displayName?: string;
  gamerTag?: string;
  username?: string;
  email?: string;
  photoURL?: string;
  role: string;
  memberId: string;
  createdAt?: { toDate: () => Date };
  active?: boolean;
}

interface EventOption {
  id: string;
  title: string;
  date: string;
  time: string;
}

// ── Inner component that uses useSearchParams (must be inside Suspense) ────────
function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin } = useAuth();

  const [state, setState] = useState<State>("loading");
  const [member, setMember] = useState<MemberData | null>(null);
  const [joinDate, setJoinDate] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);
  const loggedRef = useRef(false);

  // Walk-in registration state
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);

  const rawId = searchParams.get("id");

  // Admin guard
  useEffect(() => {
    if (user === null) { router.replace("/login"); return; }
    if (user && !isAdmin) { router.replace("/dashboard"); }
  }, [user, router, isAdmin]);

  // Firestore lookup
  useEffect(() => {
    if (!rawId || !user || !isAdmin) return;
    setTargetId(rawId);
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", rawId));
        if (!snap.exists()) { setState("not_found"); return; }
        const data = snap.data() as MemberData;

        try {
          const pubSnap = await getDoc(doc(db, "users", rawId, "public", "profile"));
          if (pubSnap.exists()) {
            const pubData = pubSnap.data();
            if (pubData.username) data.username = pubData.username;
            if (pubData.photoURL) data.photoURL = pubData.photoURL;
          }
        } catch (e) {
          console.error("Failed to load public profile:", e);
        }

        setMember(data);
        if (data.createdAt?.toDate) {
          const d = data.createdAt.toDate();
          setJoinDate(`${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`);
        }
        const isValid = data.active !== false;
        setState(isValid ? "valid" : "inactive");

        // Log attendance on successful scan
        if (isValid && !loggedRef.current) {
          loggedRef.current = true;
          try {
            await addDoc(collection(db, "attendance"), {
              uid: rawId,
              eventId: searchParams.get("event") || null,
              scannedAt: serverTimestamp(),
              scannedBy: user.uid,
            });
          } catch (e) {
            console.error("Failed to log attendance:", e);
          }
        }

        // Fetch open events for walk-in registration
        if (isValid) {
          try {
            const evSnap = await getDocs(
              query(collection(db, "events"), where("approval", "==", "approved"))
            );
            const evList: EventOption[] = evSnap.docs.map(d => ({
              id: d.id,
              title: d.data().title,
              date: d.data().date,
              time: d.data().time,
            }));
            setEvents(evList);

            // Check which events the member is already registered for
            const alreadyIn = await Promise.all(
              evList.map(async (ev) => {
                const regDoc = await getDoc(doc(db, "events", ev.id, "registrations", rawId));
                return regDoc.exists() ? ev.id : null;
              })
            );
            setRegisteredEventIds(alreadyIn.filter(Boolean) as string[]);
          } catch (e) {
            console.error("Failed to fetch events for walk-in:", e);
          }
        }
      } catch {
        setState("not_found");
      }
    })();
  }, [rawId, user, isAdmin, searchParams]);

  const handleWalkInRegister = async () => {
    if (!selectedEventId || !targetId || !user) return;
    setIsRegistering(true);
    try {
      const memberName =
        member?.username || member?.displayName || member?.gamerTag ||
        member?.email?.split("@")[0] || "Member";

      // Create registration doc for the member
      await setDoc(doc(db, "events", selectedEventId, "registrations", targetId), {
        userId: targetId,
        name: memberName,
        status: "pending",
        walkIn: true,
        registeredBy: user.uid, // admin who registered them
        timestamp: serverTimestamp(),
      });

      // Increment the event's registration count (but don't flip to "full")
      const evSnap = await getDoc(doc(db, "events", selectedEventId));
      if (evSnap.exists()) {
        const evData = evSnap.data();
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "events", selectedEventId), {
          currentRegistrations: (evData.currentRegistrations || 0) + 1,
        });
      }

      setRegisteredEventIds(prev => [...prev, selectedEventId]);
      setSelectedEventId("");
      toast.success(`Walk-in registered for ${events.find(e => e.id === selectedEventId)?.title}!`);
    } catch (e) {
      console.error("Walk-in registration failed:", e);
      toast.error("Walk-in registration failed.");
    }
    setIsRegistering(false);
  };

  if (state === "loading" || user === undefined) {
    return <Spinner />;
  }
  if (!user || !isAdmin) return null;

  const cfg = {
    valid:     { border: "#22c55e", icon: <CheckCircle2 size={64} color="#22c55e" strokeWidth={1.5} />, bannerColor: "#22c55e", bannerLabel: "VERIFIED",  subtitle: "This person is a registered BDJ member." },
    inactive:  { border: "#f59e0b", icon: <AlertTriangle size={64} color="#f59e0b" strokeWidth={1.5} />, bannerColor: "#f59e0b", bannerLabel: "INACTIVE",  subtitle: "This account exists but is not an active member." },
    not_found: { border: "#FF4D2E", icon: <XCircle size={64} color="#FF4D2E" strokeWidth={1.5} />,       bannerColor: "#FF4D2E", bannerLabel: "INVALID",   subtitle: "No member found with this ID. This QR code may be invalid or expired." },
  }[state];

  const displayName =
    member?.username ||
    member?.displayName ||
    member?.gamerTag ||
    member?.email?.split("@")[0] ||
    "Unknown Member";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const availableEvents = events.filter(e => !registeredEventIds.includes(e.id));

  return (
    <div style={{
      width: "100%", maxWidth: "min(400px, 92vw)", display: "flex",
      flexDirection: "column", gap: 16,
    }}>
      {/* Member card */}
      <div style={{
        background: "#0a0e1a",
        borderRadius: 24, border: `1px solid ${cfg.border}33`,
        overflow: "hidden", boxShadow: `0 0 60px ${cfg.border}22`,
      }}>
        <div style={{ height: 4, background: cfg.border }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40 }}>
          {cfg.icon}
        </div>

        <div style={{ margin: "20px 24px 0", borderRadius: 10, background: `${cfg.bannerColor}18`, padding: "8px 0", textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", color: cfg.bannerColor, textTransform: "uppercase" }}>
            {cfg.bannerLabel}
          </span>
        </div>

        {state !== "not_found" && member ? (
            <div style={{ padding: "24px 24px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                border: `2px solid ${cfg.border}66`, overflow: "hidden",
                background: `${cfg.border}22`, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {member.photoURL
                  ? <Image src={member.photoURL} alt="avatar" width={80} height={80} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  : <span style={{ fontSize: 28, fontWeight: 900, color: "white" }}>{initials}</span>
                }
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "clamp(1.1rem, 5vw, 1.4rem)", fontWeight: 700, color: "white" }}>{displayName}</p>
                {member.memberId && (
                  <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", background: `${cfg.border}18`, border: `1px solid ${cfg.border}55`, borderRadius: 10, padding: "6px 16px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 13, color: cfg.border, fontWeight: 700, letterSpacing: "0.1em" }}>
                      #{member.memberId}
                    </span>
                  </div>
                )}
              </div>

              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", background: `${cfg.border}22`, color: cfg.border, padding: "6px 18px", borderRadius: 20 }}>
                {member.role || "Member"}
              </span>

            {joinDate && (
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Member since {joinDate}
              </p>
            )}

            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 1.6 }}>
              {cfg.subtitle}
            </p>
          </div>
        ) : (
          <div style={{ padding: "20px 24px 32px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>{cfg.subtitle}</p>
            {targetId && (
              <p style={{ marginTop: 12, fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.2)", wordBreak: "break-all" }}>
                ID: {targetId}
              </p>
            )}
          </div>
        )}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "12px 24px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 9, letterSpacing: "0.18em", color: "rgba(255,255,255,0.15)", textTransform: "uppercase" }}>
            BDJ · Admin Verification
          </p>
        </div>
      </div>

      {/* Walk-in registration panel — only shown for valid members */}
      {state === "valid" && events.length > 0 && (
        <div style={{
          background: "#0a0e1a", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "20px 20px 24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <UserPlus size={16} color="#22c55e" />
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
              Register Walk-in
            </span>
          </div>

          {availableEvents.length === 0 ? (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
              Already registered for all available events.
            </p>
          ) : (
            <>
              {/* Event selector */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  style={{
                    width: "100%", background: "#131929",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, padding: "12px 36px 12px 14px",
                    color: selectedEventId ? "white" : "rgba(255,255,255,0.35)",
                    fontSize: 12, fontWeight: 600, appearance: "none",
                    cursor: "pointer", outline: "none",
                  }}
                >
                  <option value="" disabled>Select an event…</option>
                  {availableEvents.map(ev => (
                    <option key={ev.id} value={ev.id} style={{ color: "white", background: "#131929" }}>
                      {ev.title} — {ev.date}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  color="rgba(255,255,255,0.4)"
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                />
              </div>

              {/* Already registered events */}
              {registeredEventIds.length > 0 && (
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 10, letterSpacing: "0.06em" }}>
                  ✓ Already registered: {events.filter(e => registeredEventIds.includes(e.id)).map(e => e.title).join(", ")}
                </p>
              )}

              <button
                onClick={handleWalkInRegister}
                disabled={!selectedEventId || isRegistering}
                style={{
                  width: "100%", padding: "13px 0",
                  borderRadius: 12, border: "none",
                  background: selectedEventId ? "#22c55e" : "rgba(34,197,94,0.15)",
                  color: selectedEventId ? "white" : "rgba(34,197,94,0.4)",
                  fontSize: 11, fontWeight: 900, letterSpacing: "0.18em",
                  textTransform: "uppercase", cursor: selectedEventId ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.3s ease",
                  boxShadow: selectedEventId ? "0 0 30px -5px rgba(34,197,94,0.4)" : "none",
                }}
              >
                {isRegistering
                  ? <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Registering…</>
                  : <><UserPlus size={14} /> Confirm Walk-in</>
                }
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(255,95,95,0.2)", borderTopColor: "#FF4D2E",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", margin: 0, textTransform: "uppercase" }}>
        Verifying...
      </p>
    </div>
  );
}

// ── Page export — wraps VerifyContent in Suspense ──────────────────────────────
export default function AdminVerifyPage() {
  return (
    <div style={{
      minHeight: "100svh", background: "#060912",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "Inter, sans-serif",
    }}>
      <Suspense fallback={<Spinner />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
