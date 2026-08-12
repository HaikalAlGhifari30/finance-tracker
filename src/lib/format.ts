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
