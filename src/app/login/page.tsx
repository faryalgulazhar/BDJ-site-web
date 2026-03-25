import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 font-sans selection:bg-[#FF5F5F]/30 bg-[#0e0e0e] min-h-screen">
      <div className="w-full max-w-md bg-[#161616] border border-white/5 rounded-[2.5rem] p-10 md:p-12 shadow-2xl relative overflow-hidden my-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[100px] bg-red-500/5 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to your BDJ Karukera account.</p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-gray-600 mt-10">
          Don't have an account? <Link href="/register" className="text-[#FF5F5F] font-bold hover:text-red-400 transition-colors">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
