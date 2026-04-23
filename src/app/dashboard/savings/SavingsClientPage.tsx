"use client";

import { useState, useTransition } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Plus, Target, TrendingUp, History, CreditCard, ChevronRight, Trophy, Star, Wallet, Edit2 } from "lucide-react";
import GoalModal from "./GoalModal";
import { Pagination } from "@/components/ui/Pagination";
import { useMemo, useEffect } from "react";
import { setMainGoal } from "@/app/actions/goals";
import { toast } from "sonner";
import GoalActionMenu from "./GoalActionMenu";

export default function SavingsClientPage({ totalSavingsPool, goals, history }: { totalSavingsPool: number, goals: any[], history: any[] }) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return history.slice(start, start + pageSize);
  }, [history, currentPage, pageSize]);

  return (
    <div className="space-y-10 animate-fade-in text-left">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Tabungan & Goals</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Satu saldo untuk berbagai tujuan masa depan Anda.</p>
        </div>
        <button 
          onClick={() => setIsGoalModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-8 py-4 rounded-[24px] text-sm font-black shadow-xl shadow-amber-500/20 hover:opacity-90 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tambah Goal Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gold Summary Card */}
        <GlassCard className="lg:col-span-4 p-10 bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 text-white border-none shadow-[0_20px_50px_rgba(245,158,11,0.3)] flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Trophy className="w-40 h-40 rotate-12" />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Star className="w-5 h-5 text-yellow-200 fill-yellow-200" />
                </div>
                <p className="text-amber-100 text-[11px] font-black uppercase tracking-[0.2em] opacity-90">Total Tabungan</p>
              </div>
              <h3 className="text-5xl font-black tracking-tighter">Rp {totalSavingsPool.toLocaleString("id-ID")}</h3>
           </div>
           <div className="mt-12 relative z-10">
              <div className="flex items-center gap-2 text-amber-100/80 text-xs font-bold bg-black/10 w-fit px-4 py-2 rounded-full backdrop-blur-md border border-white/5">
                 <TrendingUp className="w-4 h-4" />
                 Akumulasi dari pengeluaran kategori Tabungan
              </div>
           </div>
        </GlassCard>

        {/* Goals List */}
        <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-3">
                    <Target className="w-6 h-6 text-amber-500" />
                    Tujuan Tabungan
                </h3>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Klik bintang untuk set Utama</span>
                    </div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{goals.length} Goals Aktif</span>
                </div>
            </div>

            <div className="md:hidden px-2 mb-4">
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Tip: Klik bintang pada goal untuk ditampilkan di Dashboard Utama</span>
                </div>
            </div>

            {goals.length === 0 ? (
                <GlassCard className="p-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Target className="w-12 h-12 text-amber-300" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-black text-xl">Belum ada Goal</p>
                    <p className="text-sm text-gray-400 mt-2">Mulai tentukan target finansial Anda hari ini.</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map((goal) => {
                        const progress = Math.min((totalSavingsPool / Number(goal.targetAmount)) * 100, 100);
                        const actualProgress = (totalSavingsPool / Number(goal.targetAmount)) * 100;
                        const isMain = goal.isMain;
                        
                        return (
                            <GlassCard key={goal.id} className={`p-8 hover:border-amber-500/50 transition-all group relative overflow-hidden ${isMain ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl shadow-amber-500/10' : ''}`}>
                                {isMain && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
                                            <Star className="w-2 h-2 fill-white" />
                                            Goals Utama
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-xl text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">{goal.name}</h4>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startTransition(async () => {
                                                        const res = await setMainGoal(isMain ? null : goal.id);
                                                        if (res.error) toast.error(res.error);
                                                        else toast.success(isMain ? "Berhasil menghapus goals utama" : `"${goal.name}" dipilih sebagai goals utama!`);
                                                    });
                                                }}
                                                className={`p-2 rounded-xl transition-all ${isMain ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-gray-300 hover:text-amber-500 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-amber-100 dark:hover:border-amber-900/50'}`}
                                                title={isMain ? "Hapus dari Utama" : "Set sebagai Utama"}
                                            >
                                                <Star className={`w-4 h-4 ${isMain ? 'fill-amber-500' : ''}`} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target: Rp {Number(goal.targetAmount).toLocaleString("id-ID")}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className={`p-3 rounded-2xl transition-all ${progress >= 100 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <GoalActionMenu 
                                            goal={goal} 
                                            onEdit={(g) => {
                                                setSelectedGoal(g);
                                                setIsGoalModalOpen(true);
                                            }} 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Progress</span>
                                        <span className="text-lg font-black text-amber-500">{actualProgress.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700 p-0.5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                        <span>Rp {totalSavingsPool.toLocaleString("id-ID")}</span>
                                        <span>Rp {Number(goal.targetAmount).toLocaleString("id-ID")}</span>
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-6">
        <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-3 px-2">
            <History className="w-6 h-6 text-amber-500" />
            Riwayat Tabungan
        </h3>
        <GlassCard className="p-0 overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
            {history.length === 0 ? (
                <div className="p-20 text-center">
                    <p className="text-gray-400 font-bold italic">Belum ada riwayat setoran tabungan.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100/70 dark:bg-gray-800/50">
                                <th className="px-8 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Tanggal</th>
                                <th className="px-8 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Tujuan</th>
                                <th className="px-8 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Keterangan</th>
                                <th className="px-8 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 text-center">Nominal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {paginatedHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors group">
                                    <td className="px-8 py-5 text-sm text-gray-600 dark:text-gray-400 font-bold">
                                        {format(new Date(item.date), "dd/MM/yyyy")}
                                    </td>
                                    <td className="px-8 py-5">
                                        {item.goalName ? (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200/50">
                                                {item.goalName}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">Umum</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-sm text-gray-500 dark:text-gray-500 font-medium">
                                        {item.description || "-"}
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-amber-600 text-center">
                                        + Rp {Number(item.amount).toLocaleString("id-ID")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                  currentPage={currentPage}
                  totalPages={Math.ceil(history.length / pageSize)}
                  totalItems={history.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
                </>
            )}
        </GlassCard>
      </div>

      <GoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => {
            setIsGoalModalOpen(false);
            setSelectedGoal(null);
        }} 
        initialData={selectedGoal}
      />
    </div>
  );
}
