import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users, User, ChevronDown } from "lucide-react";
import { getMemberColor } from "@/lib/format";

interface Member {
  id: string;
  name: string;
  isOwner: boolean;
  isActive: boolean;
}

interface MemberFilterProps {
  members: Member[];
  className?: string;
  hideAll?: boolean;
  value?: string;
  onChange?: (id: string) => void;
}

export function MemberFilter({ members, className = "", hideAll = false, value, onChange }: MemberFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMember = value !== undefined ? value : (searchParams.get("member") || (hideAll ? (members[0]?.id || "") : "all"));
  const [isOpen, setIsOpen] = useState(false);

  const handleMemberChange = (id: string) => {
    if (onChange) {
      onChange(id);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "all") {
        params.delete("member");
      } else {
        params.set("member", id);
      }
      router.push(`${pathname}?${params.toString()}`);
    }
    setIsOpen(false);
  };

  const currentLabel = currentMember === "all" ? "Semua" : (members.find(m => m.id === currentMember)?.name || "Pilih Anggota");

  return (
    <div className={`relative ${className} z-30`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 rounded-2xl bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 min-w-0 justify-between"
      >
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 overflow-hidden">
          {currentMember === "all" ? <Users className="w-4 h-4 text-emerald-500 shrink-0" /> : <User className="w-4 h-4 text-blue-500 shrink-0" />}
          <span className="truncate">{currentLabel}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#1E1E2D] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in zoom-in duration-200">
            <div className="px-5 py-2 mb-1 border-b border-gray-50 dark:border-gray-800/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pilih Anggota</span>
            </div>
            
            {!hideAll && (
              <button
                onClick={() => handleMemberChange("all")}
                className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-bold transition-colors ${currentMember === 'all' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <Users className={`w-4 h-4 ${currentMember === 'all' ? 'text-emerald-500' : 'text-gray-400'}`} />
                Semua Anggota
              </button>
            )}
            
            {members.map((member) => {
              const color = getMemberColor(member.id, members);
              const isSelected = currentMember === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => handleMemberChange(member.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-bold transition-colors ${isSelected ? `${color.bg} ${color.text}` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                  {member.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
