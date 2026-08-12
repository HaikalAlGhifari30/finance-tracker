import React from "react";

export function GoldBarIcon({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* 3D Gold Ingot / Batangan Emas SVG */}
      <polygon points="6 14 8 7 16 7 18 14 6 14" fill="currentColor" fillOpacity="0.25" />
      <polygon points="4 19 6 14 18 14 20 19 4 19" fill="currentColor" fillOpacity="0.45" />
      <line x1="9" y1="10.5" x2="15" y2="10.5" strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}
