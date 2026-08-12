/**
 * Returns a stable color palette for a member tag based on their name.
 * Each unique name always gets the same color, and colors cycle through
 * a curated set so members are visually distinct.
 */

const MEMBER_PALETTES = [
  // violet
  {
    text:    "text-violet-700 dark:text-violet-300",
    bg:      "bg-violet-50 dark:bg-violet-900/20",
    border:  "border-violet-200 dark:border-violet-700/40",
  },
  // sky / blue
  {
    text:    "text-sky-700 dark:text-sky-300",
    bg:      "bg-sky-50 dark:bg-sky-900/20",
    border:  "border-sky-200 dark:border-sky-700/40",
  },
  // amber / orange
  {
    text:    "text-amber-700 dark:text-amber-300",
    bg:      "bg-amber-50 dark:bg-amber-900/20",
    border:  "border-amber-200 dark:border-amber-700/40",
  },
  // rose / pink
  {
    text:    "text-rose-700 dark:text-rose-300",
    bg:      "bg-rose-50 dark:bg-rose-900/20",
    border:  "border-rose-200 dark:border-rose-700/40",
  },
  // teal / cyan
  {
    text:    "text-teal-700 dark:text-teal-300",
    bg:      "bg-teal-50 dark:bg-teal-900/20",
    border:  "border-teal-200 dark:border-teal-700/40",
  },
  // fuchsia
  {
    text:    "text-fuchsia-700 dark:text-fuchsia-300",
    bg:      "bg-fuchsia-50 dark:bg-fuchsia-900/20",
    border:  "border-fuchsia-200 dark:border-fuchsia-700/40",
  },
  // emerald (kept as last fallback so it is not always the first)
  {
    text:    "text-emerald-700 dark:text-emerald-300",
    bg:      "bg-emerald-50 dark:bg-emerald-900/20",
    border:  "border-emerald-200 dark:border-emerald-700/40",
  },
] as const;

/** Simple djb2-style hash so the same name always gives the same index. */
function hashName(name: string): number {
  let h = 5381;
  for (let i = 0; i < name.length; i++) {
    h = (h * 33) ^ name.charCodeAt(i);
  }
  return Math.abs(h);
}

export function getMemberPalette(name: string) {
  const idx = hashName(name) % MEMBER_PALETTES.length;
  return MEMBER_PALETTES[idx];
}

/**
 * Returns a single className string for the tag span.
 * Usage:
 *   <span className={getMemberTagClass(item.memberName)}>
 *     {item.memberName}
 *   </span>
 */
export function getMemberTagClass(name: string, size: "xs" | "sm" = "xs"): string {
  const p = getMemberPalette(name);
  const base =
    "font-black uppercase tracking-widest rounded-full border " +
    `${p.text} ${p.bg} ${p.border}`;

  if (size === "sm") {
    return `text-[9px] px-2 py-0.5 ${base}`;
  }
  return `text-[7px] px-1.5 py-0.5 ${base}`;
}
