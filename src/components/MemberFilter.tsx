import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users, User, ChevronDown } from "lucide-react";

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
}

export function MemberFilter({ members, className = "", hideAll = false }: MemberFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMember = searchParams.get("member") || (hideAll ? (members[0]?.id || "") : "all");
  const [isOpen, setIsOpen] = useState(false);

  const handleMemberChange = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("member");
    } else {
      params.set("member", id);
    }
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const currentLabel = currentMember === "all" ? "Semua Anggota" : (members.find(m => m.id === currentMember)?.name || "Pilih Anggota");

  return (
    <div className={`relative ${className} z-30`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          {currentMember === "all" ? <Users className="w-4 h-4 text-emerald-500" /> : <User className="w-4 h-4 text-blue-500" />}
          <span>{currentLabel}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
            
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => handleMemberChange(member.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-bold transition-colors ${currentMember === member.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <User className={`w-4 h-4 ${currentMember === member.id ? 'text-blue-500' : 'text-gray-400'}`} />
                {member.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
