"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const ADMIN_EMAIL = "admin@bdj-karukera.com";
type State = "loading" | "valid" | "inactive" | "not_found";

interface MemberData {
  displayName: string;
  photoURL?: string;
  role: string;
  memberId: string;
  createdAt?: { toDate: () => Date };
  active?: boolean;
}

// ── Inner component that uses useSearchParams (must be inside Suspense) ────────
function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [state, setState] = useState<State>("loading");
  const [member, setMember] = useState<MemberData | null>(null);
  const [joinDate, setJoinDate] = useState("");

  const targetId = searchParams.get("id");

  // Admin guard
  useEffect(() => {
    if (user === null) { router.replace("/login"); return; }
    if (user && user.email !== ADMIN_EMAIL) { router.replace("/dashboard"); }
  }, [user, router]);

  // Firestore lookup
  useEffect(() => {
    if (!targetId || !user || user.email !== ADMIN_EMAIL) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", targetId));
        if (!snap.exists()) { setState("not_found"); return; }
        const data = snap.data() as MemberData;
        setMember(data);
        if (data.createdAt?.toDate) {
          const d = data.createdAt.toDate();
          setJoinDate(`${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`);
        }
        setState(data.active === false ? "inactive" : "valid");
      } catch {
        setState("not_found");
      }
    })();
  }, [targetId, user]);

  if (state === "loading" || user === undefined) {
    return (
      <Spinner />
    );
  }
  if (!user || user.email !== ADMIN_EMAIL) return null;

  const cfg = {
    valid:     { border: "#22c55e", icon: <CheckCircle2 size={56} color="#22c55e" strokeWidth={1.5} />, bannerColor: "#22c55e", bannerLabel: "VERIFIED",  subtitle: "This person is a registered BDJ Karukera member." },
    inactive:  { border: "#f59e0b", icon: <AlertTriangle size={56} color="#f59e0b" strokeWidth={1.5} />, bannerColor: "#f59e0b", bannerLabel: "INACTIVE",  subtitle: "This account exists but is not an active member." },
    not_found: { border: "#FF4D2E", icon: <XCircle size={56} color="#FF4D2E" strokeWidth={1.5} />,       bannerColor: "#FF4D2E", bannerLabel: "INVALID",   subtitle: "No member found with this ID. This QR code may be invalid or expired." },
  }[state];

  const displayName = member?.displayName || "Unknown Member";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{
      width: "100%", maxWidth: 360, background: "#0a0e1a",
      borderRadius: 24, border: `1px solid ${cfg.border}33`,
      overflow: "hidden", boxShadow: `0 0 60px ${cfg.border}22`,
    }}>
      <div style={{ height: 3, background: cfg.border }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 36 }}>
        {cfg.icon}
      </div>

      <div style={{ margin: "20px 24px 0", borderRadius: 10, background: `${cfg.bannerColor}18`, padding: "8px 0", textAlign: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", color: cfg.bannerColor, textTransform: "uppercase" }}>
          {cfg.bannerLabel}
        </span>
      </div>

      {state !== "not_found" && member ? (
        <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            border: `2px solid ${cfg.border}66`, overflow: "hidden",
            background: `${cfg.border}22`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {member.photoURL
              ? <Image src={member.photoURL} alt="avatar" width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              : <span style={{ fontSize: 26, fontWeight: 900, color: "white" }}>{initials}</span>
            }
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "white" }}>{displayName}</p>
            {member.memberId && (
              <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", background: `${cfg.border}18`, border: `1px solid ${cfg.border}55`, borderRadius: 8, padding: "4px 12px" }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: cfg.border, fontWeight: 700, letterSpacing: "0.1em" }}>
                  #{member.memberId}
                </span>
              </div>
            )}
          </div>

          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", background: `${cfg.border}22`, color: cfg.border, padding: "4px 14px", borderRadius: 20 }}>
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
          BDJ Karukera · Admin Verification
        </p>
      </div>
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
