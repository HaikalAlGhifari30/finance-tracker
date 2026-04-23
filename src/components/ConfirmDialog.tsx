"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Background Overlay with Full Screen Blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onCancel} 
      />
      
      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-[#1E1E2D] w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-300">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6">
          <X className="w-8 h-8 text-rose-600" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
          {message}
        </p>
        
        <div className="flex w-full gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 py-4 text-sm font-bold text-gray-600 dark:text-gray-300 transition-all active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-[1.5] rounded-2xl bg-rose-600 hover:bg-rose-700 py-4 text-sm font-bold text-white transition-all shadow-lg shadow-rose-500/30 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
