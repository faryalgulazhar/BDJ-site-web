"use client";

import { X, Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "ERASE DATA?",
  description = "This action is irreversible. The data will be permanently purged from the mainframe.",
  confirmLabel = "CONFIRM PURGE",
  cancelLabel = "ABORT MISSION"
}: DeleteConfirmModalProps) {
  const { isIceTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
      <div className={`bg-[#0a0a0a] border ${isIceTheme ? 'border-primary/20 shadow-[0_0_40px_-15px_rgba(63,206,238,0.2)]' : 'border-red-500/20 shadow-[0_0_40px_-15px_rgba(239,68,68,0.2)]'} w-full max-w-md rounded-[2.5rem] p-10 relative overflow-hidden animate-in zoom-in duration-300`}>
         <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isIceTheme ? 'via-primary/50' : 'via-red-500/50'} to-transparent`} />
         <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
           <X size={24} />
         </button>
         
         <div className="flex flex-col items-center text-center gap-6">
           <div className={`w-16 h-16 rounded-2xl ${isIceTheme ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_20px_-5px_rgba(63,206,238,0.3)]' : 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]'} border flex items-center justify-center`}>
             <Trash2 size={32} />
           </div>
           
           <div>
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{title}</h2>
             <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed px-4">
               {description}
             </p>
           </div>

           <div className="w-full flex flex-col gap-3 mt-4">
             <button 
              onClick={onConfirm}
              className={`w-full ${isIceTheme ? 'bg-primary hover:bg-primary/80 shadow-[0_0_30px_-10px_rgba(63,206,238,0.4)]' : 'bg-red-500 hover:bg-red-600 shadow-[0_0_30px_-10px_rgba(239,68,68,0.4)]'} text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2`}
             >
               <Trash2 size={16} />
               {confirmLabel}
             </button>
             <button 
              onClick={onClose}
              className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/5"
             >
               {cancelLabel}
             </button>
           </div>
         </div>
      </div>
    </div>
  );
}
