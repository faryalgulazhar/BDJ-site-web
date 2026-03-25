import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="w-10 h-10 text-[#FF5F5F] animate-spin" />
        <h2 className="text-[#FF5F5F] font-black tracking-widest text-sm uppercase animate-pulse">
          LOADING ARENA...
        </h2>
      </div>
    </div>
  );
}
