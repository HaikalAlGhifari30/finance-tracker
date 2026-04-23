"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed top-5 right-5 z-[99999] flex items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl border text-sm font-medium min-w-[260px] max-w-sm animate-in slide-in-from-right transition-all
        ${type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
          : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
        }
      `}
    >
      {type === "success"
        ? <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      }
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none flex-shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const show = useCallback((message: string, type: ToastType = "success") => setToast({ message, type }), []);
  const hide = useCallback(() => setToast(null), []);
  return { toast, show, hide };
}
