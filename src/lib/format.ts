/**
 * Formats a number or string into a Rupiah formatted string with dots as thousand separators.
 * Example: 50000 -> 50.000
 */
export const formatRupiah = (value: string | number): string => {
  if (!value && value !== 0) return "";
  const stringValue = value.toString().replace(/\D/g, "");
  if (!stringValue) return "";
  return parseInt(stringValue, 10).toLocaleString("id-ID");
};

/**
 * Removes all non-digit characters from a string.
 * Example: 50.000 -> 50000
 */
export const unformatRupiah = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Normalizes purity inputs like "10 Karat", "15 Karat", "18K", "85%" into a clean, uniform percentage string (e.g. "42%", "62.5%", "75%").
 */
export const formatPurityPercentage = (purity: string | null | undefined): string => {
  if (!purity) return "75%";
  const p = purity.trim();
  
  if (p.includes("%")) {
    const match = p.match(/(\d+(?:\.\d+)?)\s*%/);
    if (match) return `${match[1]}%`;
    return p;
  }

  const karatMatch = p.match(/(\d+(?:\.\d+)?)/);
  if (karatMatch) {
    const k = parseFloat(karatMatch[1]);
    if (k > 0 && k <= 24) {
      if (k === 6) return "25%";
      if (k === 9) return "37.5%";
      if (k === 10) return "42%";
      if (k === 14) return "58.5%";
      if (k === 15) return "62.5%";
      if (k === 16 || k === 17) return "70%";
      if (k === 18) return "75%";
      if (k === 19) return "80%";
      if (k === 20) return "83.3%";
      if (k === 21) return "87.5%";
      if (k === 22) return "91.6%";
      if (k === 23) return "95.8%";
      if (k === 24) return "99.9%";
      
      const pct = (k / 24) * 100;
      return `${parseFloat(pct.toFixed(1))}%`;
    }
  }

  return p;
};

export const MEMBER_COLOR_PALETTES = [
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/50",
    badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800/50",
    badge: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50",
    dot: "bg-violet-500",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/50",
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/50",
    badge: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50",
    dot: "bg-blue-500",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800/50",
    badge: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-800/50",
    badge: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50",
    dot: "bg-sky-500",
  },
];

export function getMemberColor(memberIdOrName: string, membersList?: any[]) {
  if (!memberIdOrName) return MEMBER_COLOR_PALETTES[0];

  let index = 0;
  if (membersList && Array.isArray(membersList) && membersList.length > 0) {
    const idx = membersList.findIndex(m => m.id === memberIdOrName || m.name === memberIdOrName);
    if (idx >= 0) {
      index = idx;
    } else {
      let hash = 0;
      for (let i = 0; i < memberIdOrName.length; i++) {
        hash = memberIdOrName.charCodeAt(i) + ((hash << 5) - hash);
      }
      index = Math.abs(hash);
    }
  } else {
    let hash = 0;
    for (let i = 0; i < memberIdOrName.length; i++) {
      hash = memberIdOrName.charCodeAt(i) + ((hash << 5) - hash);
    }
    index = Math.abs(hash);
  }

  return MEMBER_COLOR_PALETTES[index % MEMBER_COLOR_PALETTES.length];
}
