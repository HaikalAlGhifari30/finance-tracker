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
