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

  return (
    <button 
      onClick={() => user ? router.push('/planning') : router.push('/register')}
      className={className}
    >
      {user ? secondaryText : primaryText}
    </button>
  );
}
