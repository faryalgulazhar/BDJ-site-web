"use client";

import { useEffect, useState } from "react";
import { Droplet, Flame } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-[18px] h-[18px]" />;

  return (
    <button 
      onClick={toggleTheme} 
      className="text-navbar-link hover:text-primary transition-all duration-500"
      aria-label="Toggle Theme"
      title={`Switch to ${theme === "red" ? "Blue" : "Red"} Theme`}
    >
      {theme === "red" ? <Droplet size={18} className="text-blue-400" /> : <Flame size={18} className="text-coral" />}
    </button>
  );
}
