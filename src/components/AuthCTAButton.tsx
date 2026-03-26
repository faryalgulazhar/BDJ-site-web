"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthCTAButtonProps {
  primaryText: string;
  secondaryText: string;
  className: string;
}

export default function AuthCTAButton({ primaryText, secondaryText, className }: AuthCTAButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const isAdmin = user?.email === "admin@bdj-karukera.com";

  const handleClick = () => {
    if (!user) router.push('/register');
    else if (isAdmin) router.push('/operations');
    else router.push('/planning');
  };

  const displayText = !user ? primaryText : isAdmin ? "GO TO OPERATIONS" : secondaryText;

  return (
    <button 
      onClick={handleClick}
      className={className}
    >
      {displayText}
    </button>
  );
}
