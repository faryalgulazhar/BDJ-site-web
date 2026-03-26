import Link from "next/link";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const RegisterForm = dynamic(() => import("@/components/RegisterForm"), {
  loading: () => (
    <div className="flex justify-center py-10">
      <Loader2 className="animate-spin text-primary" size={24} />
    </div>
  ),
});

export default function RegisterPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 font-sans selection:bg-primary/30 bg-[#0e0e0e] min-h-screen">
      <div className="w-full max-w-md bg-[#161616] border border-white/5 rounded-[2.5rem] p-10 md:p-12 shadow-2xl relative overflow-hidden my-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[100px] bg-red-500/5 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm">Join the BDJ Karukera ecosystem today.</p>
        </div>

        <RegisterForm />

        <p className="text-center text-xs text-gray-600 mt-10">
          Already have an account? <Link href="/login" className="text-primary font-bold hover:text-primary/70 transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
