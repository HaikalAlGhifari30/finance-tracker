import { ReactNode, HTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E2D] shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
