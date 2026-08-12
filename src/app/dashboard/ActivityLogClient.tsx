"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TrendingUp, TrendingDown, Calendar, List, ArrowRightLeft, Wallet } from "lucide-react";
import { getMemberTagClass } from "@/lib/memberColors";
import { GlassCard } from "@/components/ui/GlassCard";
import { Pagination } from "@/components/ui/Pagination";

export default function ActivityLogClient({ activities }: { activities: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activities.slice(start, start + pageSize);
  }, [activities, currentPage, pageSize]);

  if (activities.length === 0) {
    return (
      <div className="p-20 text-center text-gray-400 italic font-bold bg-white dark:bg-[#1E1E2D]/20 rounded-2xl border border-gray-100 dark:border-gray-800">
        Belum ada aktivitas keuangan tercatat.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {paginatedActivities.map((tx) => (
          <div key={tx.id} className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group gap-4">
            <div className="flex items-center gap-4 md:gap-5">
              <div className={`p-2.5 md:p-3 rounded-2xl transition-all ${
                  tx.type === 'INCOME' 
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' 
                  : tx.type === 'TRANSFER'
                  ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600'
                  : tx.type === 'SAVING'
                  ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
                  : tx.type === 'WITHDRAWAL'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                  : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600'
              }`}>
                {tx.type === 'INCOME' ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : 
                 tx.type === 'TRANSFER' ? <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5" /> : 
                 tx.type === 'SAVING' ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> :
                 tx.type === 'WITHDRAWAL' ? <TrendingDown className="w-4 h-4 md:w-5 md:h-5" /> :
                 <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-left">
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-none">{tx.description || tx.categoryName || (tx.type === 'SAVING' ? 'Menabung' : tx.type === 'WITHDRAWAL' ? 'Tarik Tabungan' : 'Umum')}</p>
                    <span className={`text-[7px] md:text-[8px] font-black px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        tx.type === 'INCOME' 
                        ? 'bg-blue-100 text-blue-600' 
                        : tx.type === 'TRANSFER'
                        ? 'bg-purple-100 text-purple-600'
                        : tx.type === 'SAVING'
                        ? 'bg-amber-100 text-amber-600'
                        : tx.type === 'WITHDRAWAL'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                        {tx.type === 'INCOME' ? 'Pemasukan' : 
                         tx.type === 'TRANSFER' ? 'Transfer' : 
                         tx.type === 'SAVING' ? 'Tabungan' :
                         tx.type === 'WITHDRAWAL' ? 'Penarikan' :
                         'Pengeluaran'}
                    </span>
                    {tx.memberName && (
                      <span className={getMemberTagClass(tx.memberName, "sm")}>
                        {tx.memberName}
                      </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <p className="text-[9px] md:text-[10px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap">
                    <Calendar className="w-3 h-3" />
                    {(() => {
                      if (typeof tx.date === 'string') {
                        const parts = tx.date.split('T')[0].split('-');
                        if (parts.length === 3) {
                          const localD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                          return format(localD, "dd MMM yyyy", { locale: id });
                        }
                      }
                      return format(new Date(tx.date), "dd MMM yyyy", { locale: id });
                    })()}
                  </p>
                  <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                  <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                    <Wallet className="w-3 h-3" />
                    {tx.accountName}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-12 sm:pl-0">
              <p className={`text-sm md:text-base font-black tracking-tight ${
                  tx.type === 'INCOME' ? 'text-blue-600' : 
                  tx.type === 'TRANSFER' ? 'text-purple-600' : 
                  tx.type === 'SAVING' ? 'text-amber-600' :
                  tx.type === 'WITHDRAWAL' ? 'text-blue-600' :
                  'text-orange-600'
              }`}>
                {tx.type === 'INCOME' ? '+' : 
                 tx.type === 'SAVING' ? '-' : 
                 tx.type === 'WITHDRAWAL' ? '+' :
                 tx.type === 'TRANSFER' ? '' : '-'} Rp {Number(tx.amount).toLocaleString("id-ID")}
              </p>
              <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5 opacity-60">
                {tx.type === 'TRANSFER' ? 'Internal' : 
                 tx.type === 'SAVING' ? 'Deposit' :
                 tx.type === 'WITHDRAWAL' ? 'Withdrawal' :
                 tx.categoryName || 'Umum'}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto">
        <Pagination 
          currentPage={currentPage}
          totalPages={Math.ceil(activities.length / pageSize)}
          totalItems={activities.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
