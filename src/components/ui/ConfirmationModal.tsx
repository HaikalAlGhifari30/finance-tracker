"use client";

import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useEffect, useState } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger"
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const variantStyles = {
    danger: "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20",
    warning: "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20",
    info: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
  };

  const iconStyles = {
    danger: "text-rose-500 bg-rose-50 dark:bg-rose-900/20",
    warning: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
    info: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <GlassCard className="relative w-full max-w-md bg-white dark:bg-[#1E1E2D] p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${iconStyles[variant]}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
            {message}
          </p>

          <div className="mt-10 flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-4 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 ${variantStyles[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </GlassCard>
    </div>
  );

  return createPortal(modalContent, document.body);
}
