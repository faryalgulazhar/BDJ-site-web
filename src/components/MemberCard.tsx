"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QRCodeCanvas } from "qrcode.react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { createPortal } from "react-dom";

type CardTheme = "fire" | "water";

interface MemberCardProps {
  user: User;
}

const THEMES = {
  fire:  { accent: "#FF4D2E", bg: "#1a0800" },
  water: { accent: "#00BFFF", bg: "#00101a" },
};

// ─── Standalone card layout (used both for display and canvas export) ──────────
function CardLayout({
  tk, displayName, initials, memberId, joinedLabel,
  role, userPhotoURL, verifyUrl, size = 1,
}: {
  tk: { accent: string; bg: string };
  displayName: string;
  initials: string;
  memberId: string;
  joinedLabel: string;
  role: string;
  userPhotoURL: string | null;
  verifyUrl: string;
  size?: number; // 1 = 320x190, scale proportionally
}) {
  const W = 320 * size;
  const H = 190 * size;
  const s = size; // shorthand

  return (
    <div 
      className="relative overflow-hidden shrink-0 transition-all duration-500"
      style={{
        width: size === 1 ? 'min(320px, 92vw)' : W,
        aspectRatio: '320/190',
        borderRadius: 16 * s,
        background: tk.bg,
        boxShadow: `0 ${8 * s}px ${40 * s}px rgba(0,0,0,0.6)`,
        containerType: 'size',
      }}
    >
      {/* Accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3 * s, background: tk.accent }} />

      {/* Texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(45deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 10px)",
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute", top: -20 * s, right: -20 * s,
        width: 160 * s, height: 160 * s, borderRadius: "50%",
        background: tk.accent, opacity: 0.15, filter: `blur(${40 * s}px)`, pointerEvents: "none",
      }} />

      {/* Body */}
      <div style={{
        position: "relative", zIndex: 1, padding: `${18 * s}px ${20 * s}px`,
        height: "100%", boxSizing: "border-box", display: "flex",
        flexDirection: "column", justifyContent: "space-between",
      }}>
        {/* Row 1 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11 * s, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>
            BDJ Karukera
          </span>
          <span style={{
            fontSize: 9 * s, letterSpacing: "0.12em", textTransform: "uppercase",
            background: `${tk.accent}33`, color: tk.accent,
            padding: `${3 * s}px ${10 * s}px`, borderRadius: 20 * s, fontWeight: 800,
          }}>
            {role}
          </span>
        </div>

        {/* Row 2 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 * s }}>
          {/* Avatar */}
          <div style={{
            width: 52 * s, height: 52 * s, borderRadius: "50%", flexShrink: 0,
            background: `${tk.accent}4D`, border: `${1.5 * s}px solid rgba(255,255,255,0.15)`,
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {userPhotoURL
              ? <img src={userPhotoURL} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
              : <span style={{ fontSize: 18 * s, fontWeight: 900, color: "white" }}>{initials}</span>
            }
          </div>

          {/* Meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 17 * s, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName}
            </p>
            {/* Member ID — prominent badge */}
            <div style={{
              marginTop: 4 * s, display: "inline-flex", alignItems: "center", gap: 4 * s,
              background: `${tk.accent}18`, border: `1px solid ${tk.accent}55`,
              borderRadius: 6 * s, padding: `${2 * s}px ${7 * s}px`,
            }}>
              <span style={{ fontSize: 10 * s, fontFamily: "monospace", color: tk.accent, fontWeight: 700, letterSpacing: "0.08em" }}>
                #{memberId}
              </span>
            </div>
            <p style={{ margin: `${3 * s}px 0 0`, fontSize: 9 * s, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)" }}>
              {joinedLabel}
            </p>
          </div>

          {/* QR */}
          <div style={{
            width: 52 * s, height: 52 * s, flexShrink: 0, background: "white",
            borderRadius: 6 * s, padding: 4 * s, boxSizing: "border-box",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <QRCodeCanvas value={verifyUrl} size={Math.round(44 * s)} level="H" />
          </div>
        </div>

        {/* Row 3 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: '1.5%' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                width: 5 * s, height: 5 * s, borderRadius: "50%",
                background: i === 0 ? tk.accent : "rgba(255,255,255,0.15)",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 9 * s, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
            Verified {role}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MemberCard({ user }: MemberCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<CardTheme>("fire");
  const [role, setRole] = useState("Member");
  const [memberId, setMemberId] = useState("BDJ-00001");
  const [joinedLabel, setJoinedLabel] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const tk = THEMES[theme];
  const verifyUrl = `https://bdj-site-web.vercel.app/admin/verify?id=${user.uid}`;
  const displayName = user.displayName || user.email?.split("@")[0] || "Member";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data.cardTheme) setTheme(data.cardTheme as CardTheme);
        if (data.role) setRole(data.role);
        if (data.memberId) setMemberId(data.memberId);
        if (data.createdAt?.toDate) {
          const d: Date = data.createdAt.toDate();
          setJoinedLabel(`Since ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`);
        }
        // Patch missing fields if they exist in Auth but not in Firestore
        await setDoc(ref, {
          email: user.email,
          displayName: data.displayName || user.displayName || null,
          photoURL: data.photoURL || user.photoURL || null,
        }, { merge: true });
      } else {
        const createdAt = new Date();
        await setDoc(ref, {
          email: user.email,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          role: "Member",
          cardTheme: "fire",
          createdAt: serverTimestamp(),
        });
        setJoinedLabel(`Since ${createdAt.toLocaleString("en-US", { month: "long" })} ${createdAt.getFullYear()}`);
      }
    })();
  }, [user]);

  const switchTheme = async (t: CardTheme) => {
    setTheme(t);
    await setDoc(doc(db, "users", user.uid), { cardTheme: t }, { merge: true });
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { createRoot } = await import("react-dom/client");
      const { createElement } = await import("react");

      // Build a perfectly-sized container appended to body
      const CARD_W = 640, CARD_H = 380;
      const wrapper = document.createElement("div");
      Object.assign(wrapper.style, {
        position: "fixed", top: "0", left: "0",
        width: `${CARD_W}px`, height: `${CARD_H}px`,
        overflow: "hidden", zIndex: "-1",
        background: tk.bg,
        // Prevent any scrollbar/viewport influence
        pointerEvents: "none",
      });
      document.body.appendChild(wrapper);

      const root = createRoot(wrapper);
      root.render(
        createElement(CardLayout, { ...sharedProps, size: 2 })
      );

      // Give React one frame to paint
      await new Promise(r => setTimeout(r, 80));

      const canvas = await html2canvas(wrapper, {
        scale: 2,
        width: CARD_W,
        height: CARD_H,
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        logging: false,
        windowWidth: CARD_W,
        windowHeight: CARD_H,
      });

      root.unmount();
      document.body.removeChild(wrapper);

      const link = document.createElement("a");
      link.download = "bdj-member-card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const sharedProps = { tk, displayName, initials, memberId, joinedLabel, role, userPhotoURL: user.photoURL, verifyUrl };

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full justify-center py-1">
      {/* Clickable card — opens expanded modal */}
      <div
        ref={cardRef}
        onClick={() => setExpanded(true)}
        className="cursor-pointer transition-transform duration-200 active:scale-95 w-full flex justify-center"
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
      >
        <CardLayout {...sharedProps} size={1} />
      </div>

      {/* Layout Row for Controls */}
      <div className="flex items-center justify-between w-full max-w-[320px] mt-4 px-1">
        {/* Theme swatches (Left) */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {(["fire", "water"] as CardTheme[]).map((t) => (
              <button key={t} onClick={() => switchTheme(t)} 
                className="w-8 h-8 md:w-6 md:h-6 rounded-full border-none cursor-pointer transition-all duration-300"
                style={{
                  background: THEMES[t].accent,
                  outline: theme === t ? "2px solid white" : "none",
                  outlineOffset: 3,
                  boxShadow: theme === t ? `0 0 15px ${THEMES[t].accent}88` : "none",
                  minWidth: '24px', 
                  minHeight: '24px'
                }} 
              />
            ))}
          </div>
          <span className="text-[9px] text-white/30 tracking-widest uppercase ml-1 block">THEME</span>
        </div>

        {/* Download button (Right) */}
        <button onClick={handleDownload} disabled={downloading} style={{
          fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase",
          padding: "8px 16px", borderRadius: 20, border: `1px solid ${tk.accent}55`,
          background: `${tk.accent}18`, color: tk.accent,
          cursor: downloading ? "not-allowed" : "pointer", opacity: downloading ? 0.5 : 1,
          transition: "all 0.4s ease",
        }}>
          {downloading ? "EXPORTING..." : "↓ DOWNLOAD CARD"}
        </button>
      </div>

      {/* No more hidden print div — export is done dynamically */}

      {/* Expanded modal via portal */}
      {mounted && expanded && createPortal(
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
            animation: "fadeIn 0.25s ease",
          }}
        >
          <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}`}</style>
          <div onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-5 w-[95vw] max-w-md">
            <CardLayout {...sharedProps} size={1.5} />
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">TAP OUTSIDE TO CLOSE</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
