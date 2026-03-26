"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthCTAButtonProps {
  primaryText: string;
  secondaryText: string;
  className?: string; // fallback if needed
}

export default function AuthCTAButton({ primaryText, secondaryText, className }: AuthCTAButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const isAdmin = user?.email === "admin@bdj-karukera.com";

  const handleClick = () => {
    if (!user) router.push('/register');
    else if (isAdmin) router.push('/operations');
    else router.push('/dashboard');
  };

  const displayText = !user ? primaryText : isAdmin ? "GO TO OPERATIONS" : secondaryText;
  
  // Use a strictly dynamic primary class for both roles
  const computedClassName = "bg-primary hover:opacity-80 active:scale-95 text-white dark:text-black px-8 py-4 rounded-full font-bold text-sm tracking-widest transition-all duration-500 stroke-transparent shadow-[0_0_30px_-5px_var(--shadow-primary)] hover:shadow-[0_0_40px_-3px_var(--shadow-primary)] text-center";

  return (
    <button 
      onClick={handleClick}
      className={className || computedClassName}
    >
      {displayText}
    </button>
  );
}
