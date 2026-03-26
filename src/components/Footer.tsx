import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#080808] py-10 relative z-10 w-full">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-bold tracking-[0.15em] text-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-primary font-black tracking-tighter text-sm uppercase">BDJ Karukera</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          <Link href="#" className="hover:text-gray-300 transition-all duration-500">PRIVACY POLICY</Link>
          <Link href="#" className="hover:text-gray-300 transition-all duration-500">TERMS OF SERVICE</Link>
          <Link href="#" className="hover:text-gray-300 transition-all duration-500">LEGAL MENTIONS</Link>
          <a href="https://www.instagram.com/bdj_psb" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-all duration-500">CONTACT US</a>
        </div>
        
        <div className="whitespace-nowrap opacity-60">
          &copy; 2025 BDJ KARUKERA. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
