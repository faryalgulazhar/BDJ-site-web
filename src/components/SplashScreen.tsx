"use client";

import { useEffect, useRef, useState } from "react";

export default function SplashScreen({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) setFading(true);
  }, [visible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const W = 90, H = 90;
    const cx = 45, cy = 45;
    const clipR = 44;
    const orbitR = 28;
    const TRAIL = 16;

    const FIRE_COLOR = "#FF4D2E";
    const ICE_COLOR  = "#00BFFF";

    let angle = 0;
    const trail1: { x: number; y: number }[] = [];
    const trail2: { x: number; y: number }[] = [];

    function drawTrail(
      trail: { x: number; y: number }[],
      color: string
    ) {
      if (trail.length < 2) return;
      for (let i = 1; i < trail.length; i++) {
        const progress = i / (trail.length - 1);
        const alpha = Math.pow(progress, 2) * 0.8;
        const lw = 1 + progress * 4;
        const sb = 6 * progress;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        ctx.shadowColor = color;
        ctx.shadowBlur = sb;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawDot(x: number, y: number, color: string) {
      // Outer haze
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Mid glow
      ctx.save();
      ctx.globalAlpha = 0.30;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Core
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Specular
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x - 1.5, y - 1.8, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      angle += 0.28;

      const x1 = cx + orbitR * Math.cos(angle);
      const y1 = cy + orbitR * Math.sin(angle);
      const x2 = cx + orbitR * Math.cos(angle + Math.PI);
      const y2 = cy + orbitR * Math.sin(angle + Math.PI);

      trail1.push({ x: x1, y: y1 });
      trail2.push({ x: x2, y: y2 });
      if (trail1.length > TRAIL) trail1.shift();
      if (trail2.length > TRAIL) trail2.shift();

      // Clip to circle
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, clipR, 0, Math.PI * 2);
      ctx.clip();

      // Background
      ctx.fillStyle = "#060912";
      ctx.fillRect(0, 0, W, H);

      // Orbit ring
      ctx.beginPath();
      ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Trails
      drawTrail(trail1, FIRE_COLOR);
      drawTrail(trail2, ICE_COLOR);

      // Dots
      drawDot(x1, y1, FIRE_COLOR);
      drawDot(x2, y2, ICE_COLOR);

      ctx.restore();
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        backgroundColor: "#060912",
        transition: "opacity 0.45s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <canvas ref={canvasRef} width={90} height={90} style={{ display: "block" }} />

      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)",
          margin: 0,
        }}
      >
        SYNCING ARENA PROFILE
      </p>
    </div>
  );
}
