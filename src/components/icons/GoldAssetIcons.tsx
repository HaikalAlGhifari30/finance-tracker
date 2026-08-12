import React from "react";

// 🪙 1. Logam Mulia Icon (Gold Coin Emblem with 3D gradient rim)
export function GoldCoinIcon({ className = "w-6 h-6", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="9.5" fill="url(#goldCoinGrad)" stroke="#F59E0B" strokeWidth="1" />
      <circle cx="12" cy="12" r="7" stroke="#FEE685" strokeWidth="1" strokeDasharray="1.5 1.5" fill="none" />
      <path d="M12 7.5L13.2 10.2L16 10.4L13.8 12.2L14.5 15L12 13.5L9.5 15L10.2 12.2L8 10.4L10.8 10.2L12 7.5Z" fill="#78350F" />
      <defs>
        <linearGradient id="goldCoinGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 📿 2. Gelang Emas Icon (Gold Bracelet / Bangle with Gold Links & Gem)
export function GoldBraceletIcon({ className = "w-6 h-6", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <ellipse cx="12" cy="13" rx="8.5" ry="6.5" stroke="url(#goldBraceletGrad)" strokeWidth="2.5" fill="none" />
      <circle cx="12" cy="6.5" r="2" fill="#FEE685" stroke="#D97706" strokeWidth="1" />
      <circle cx="6" cy="11" r="1.5" fill="#FBBF24" />
      <circle cx="18" cy="11" r="1.5" fill="#FBBF24" />
      <circle cx="12" cy="19.5" r="1.5" fill="#FBBF24" />
      <defs>
        <linearGradient id="goldBraceletGrad" x1="3" y1="6" x2="21" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 💍 3. Cincin Emas Icon (Gold Ring with Diamond)
export function GoldRingIcon({ className = "w-6 h-6", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="14" r="6.5" stroke="url(#goldRingGrad)" strokeWidth="2.5" fill="none" />
      <path d="M12 4.5L14.5 7.5H9.5L12 4.5Z" fill="#6EE7B7" stroke="#047857" strokeWidth="0.8" />
      <path d="M12 7.5L10 10.5H14L12 7.5Z" fill="#34D399" opacity="0.8" />
      <defs>
        <linearGradient id="goldRingGrad" x1="6" y1="8" x2="18" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 📿 4. Kalung Emas Icon (Luxury Gold Necklace with Diamond Drop Liontin)
export function GoldNecklaceIcon({ className = "w-6 h-6", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* V-Shape Elegant Gold Chain */}
      <path
        d="M4 4C4 11 8 16 12 16C16 16 20 11 20 4"
        stroke="url(#goldNecklaceGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Chain beads decoration */}
      <circle cx="6" cy="6" r="1" fill="#FEE685" />
      <circle cx="18" cy="6" r="1" fill="#FEE685" />
      <circle cx="8.5" cy="10" r="1" fill="#FEE685" />
      <circle cx="15.5" cy="10" r="1" fill="#FEE685" />
      {/* Pendant Ring Connector */}
      <circle cx="12" cy="16.5" r="1" fill="#D97706" />
      {/* Teardrop Diamond Liontin */}
      <path
        d="M12 17.5L14 20L12 22.5L10 20L12 17.5Z"
        fill="url(#goldPendantGrad)"
        stroke="#D97706"
        strokeWidth="0.8"
      />
      <circle cx="12" cy="20" r="0.8" fill="#FFFFFF" opacity="0.9" />
      <defs>
        <linearGradient id="goldNecklaceGrad" x1="4" y1="4" x2="20" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="goldPendantGrad" x1="10" y1="17.5" x2="14" y2="22.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#78350F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 💎 5. Anting Emas Icon (Pair of Gold Drop Earrings)
export function GoldEarringIcon({ className = "w-6 h-6", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Left Earring Hook & Drop Gem */}
      <path d="M7 4C6 4 5 5 5 7.5C5 9 6 10 7 10" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M7 10.5L9 14.5L7 19.5L5 14.5L7 10.5Z" fill="url(#goldEarringGrad1)" stroke="#B45309" strokeWidth="0.8" />
      <circle cx="7" cy="14.5" r="0.8" fill="#FFFFFF" opacity="0.9" />

      {/* Right Earring Hook & Drop Gem */}
      <path d="M17 4C16 4 15 5 15 7.5C15 9 16 10 17 10" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M17 10.5L19 14.5L17 19.5L15 14.5L17 10.5Z" fill="url(#goldEarringGrad2)" stroke="#B45309" strokeWidth="0.8" />
      <circle cx="17" cy="14.5" r="0.8" fill="#FFFFFF" opacity="0.9" />

      <defs>
        <linearGradient id="goldEarringGrad1" x1="5" y1="10.5" x2="9" y2="19.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="goldEarringGrad2" x1="15" y1="10.5" x2="19" y2="19.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}
