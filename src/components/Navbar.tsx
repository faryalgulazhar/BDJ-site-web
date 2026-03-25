"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sun } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navLinks = [
    { name: "HOMEPAGE", href: "/" },
    { name: "GAMES", href: "/games" },
    { name: "MEMBERSHIP", href: "/membership" },
    { name: "COMMUNITY", href: "/community" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="BDJ KARUKERA" 
              width={40} 
              height={40} 
              priority
              className="object-contain" 
            />
            <span className="text-[#FF5F5F] font-black tracking-tighter text-base uppercase hidden sm:block">
              BDJ KARUKERA
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-[12px] font-bold tracking-[0.15em] text-gray-400">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`transition-all duration-300 relative pb-1 ${
                  pathname === link.href 
                    ? "text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#FF5F5F] after:rounded-full" 
                    : "hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex text-gray-400 hover:text-white transition-all duration-300">
              <Sun size={18} />
            </button>
            <span className="hidden sm:block text-[12px] font-bold tracking-widest text-gray-400 hover:text-white cursor-pointer transition-all duration-300">
              FR/EN
            </span>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-[11px] text-gray-400 font-medium truncate max-w-[120px]">
                  {user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all duration-300"
                >
                  LOG OUT
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/register')}
                className="bg-[#FF5F5F] hover:bg-[#ff4040] text-white px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 shadow-[0_0_20px_-5px_#FF5F5F] hover:shadow-[0_0_30px_-3px_#FF5F5F]"
              >
                JOIN NOW
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
