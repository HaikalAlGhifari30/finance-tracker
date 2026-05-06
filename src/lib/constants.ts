import { CreditCard, Wallet, Smartphone, Banknote, Landmark } from "lucide-react";

export const ACCOUNT_TYPES = [
  { value: "BANK", label: "Bank", icon: Landmark },
  { value: "EWALLET", label: "E-Wallet / Bank Digital", icon: Smartphone },
  { value: "CASH", label: "Cash", icon: Banknote },
];

export const ACCOUNT_ICONS: Record<string, { icon: any; color: string; bgColor: string }> = {
  // Banks
  "BCA": { icon: Landmark, color: "#0066AE", bgColor: "bg-blue-50" },
  "MANDIRI": { icon: Landmark, color: "#FFC600", bgColor: "bg-yellow-50" },
  "BNI": { icon: Landmark, color: "#E55300", bgColor: "bg-orange-50" },
  "BRI": { icon: Landmark, color: "#00529C", bgColor: "bg-blue-50" },
  "NEO": { icon: Smartphone, color: "#FFD800", bgColor: "bg-yellow-50" },
  "BSI": { icon: Landmark, color: "#00A3AD", bgColor: "bg-teal-50" },
  
  // E-Wallets
  "OVO": { icon: Smartphone, color: "#4C2A86", bgColor: "bg-purple-50" },
  "GOPAY": { icon: Smartphone, color: "#00AED6", bgColor: "bg-cyan-50" },
  "DANA": { icon: Smartphone, color: "#118EEA", bgColor: "bg-blue-50" },
  "SHOPEEPAY": { icon: Smartphone, color: "#EE4D2D", bgColor: "bg-orange-50" },
  "LINKAJA": { icon: Smartphone, color: "#E61B2E", bgColor: "bg-red-50" },

  // Cash
  "CASH": { icon: Banknote, color: "#10B981", bgColor: "bg-emerald-50" },
  
  // Default
  "DEFAULT": { icon: Wallet, color: "#6B7280", bgColor: "bg-gray-50" },
};

export const PRESET_ACCOUNTS = [
  { name: "BCA", type: "BANK" },
  { name: "Mandiri", type: "BANK" },
  { name: "BNI", type: "BANK" },
  { name: "BRI", type: "BANK" },
  { name: "Neo", type: "EWALLET" },
  { name: "OVO", type: "EWALLET" },
  { name: "GoPay", type: "EWALLET" },
  { name: "Dana", type: "EWALLET" },
  { name: "ShopeePay", type: "EWALLET" },
  { name: "Cash", type: "CASH" },
];

export const getCategoryColorBadge = (categoryName: string | null | undefined) => {
  if (!categoryName) return "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50";
  
  const name = categoryName.toLowerCase();
  
  if (name.includes('makan')) {
    return "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-100/50 dark:border-orange-800/50";
  }
  if (name.includes('jajan')) {
    return "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-100/50 dark:border-pink-800/50";
  }
  if (name.includes('transportasi')) {
    return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100/50 dark:border-blue-800/50";
  }
  if (name.includes('kosan')) {
    return "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100/50 dark:border-purple-800/50";
  }
  if (name.includes('tagihan')) {
    return "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100/50 dark:border-rose-800/50";
  }
  if (name.includes('gaji') || name.includes('pemasukan') || name.includes('bonus')) {
    return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-800/50";
  }
  if (name.includes('hiburan')) {
    return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-800/50";
  }
  
  // Default / Lainnya -> Gray
  return "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50";
};
