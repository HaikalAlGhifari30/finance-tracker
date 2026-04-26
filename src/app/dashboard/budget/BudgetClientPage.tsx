"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";
import { 
  Plus, 
  Copy, 
  Edit2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  AlertCircle,
  PieChart,
  ArrowRight,
  TrendingUp,
  Target
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getBudgetPeriod, createBudgetPeriod, getCategoryExpensesForPeriod, upsertBudgetItems } from "@/app/actions/budget";
import BudgetActionModal from "./BudgetActionModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";

interface BudgetClientPageProps {
  allCategories: any[];
  initialMonth: string;
  initialYear: string;
}

export default function BudgetClientPage({ allCategories, initialMonth, initialYear }: BudgetClientPageProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [currentDate, setCurrentDate] = useState(new Date(parseInt(initialYear), parseInt(initialMonth) - 1));
  const [budgetPeriod, setBudgetPeriod] = useState<any>(null);
  const [categoryExpenses, setCategoryExpenses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetFinalConfirmOpen, setIsResetFinalConfirmOpen] = useState(false);

  const monthStr = (currentDate.getMonth() + 1).toString();
  const yearStr = currentDate.getFullYear().toString();

  const changePeriod = (amount: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "monthly") {
      newDate.setMonth(newDate.getMonth() + amount);
    } else {
      newDate.setFullYear(newDate.getFullYear() + amount);
    }
    setCurrentDate(newDate);
  };

  const fetchBudgetData = async () => {
    setLoading(true);
    try {
      const [period, expenses] = await Promise.all([
        getBudgetPeriod(monthStr, yearStr),
        getCategoryExpensesForPeriod(monthStr, yearStr)
      ]);
      setBudgetPeriod(period);
      setCategoryExpenses(expenses);
    } catch (error) {
      toast.error("Gagal mengambil data alokasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "monthly") {
      fetchBudgetData();
    } else {
      // Yearly logic could be implemented here, but for now we focus on monthly as per primary budget logic
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  const handleCreatePeriod = async (copy: boolean) => {
    setLoading(true);
    try {
      await createBudgetPeriod(monthStr, yearStr, copy);
      toast.success(copy ? "Alokasi berhasil disalin" : "Periode alokasi baru dibuat");
      fetchBudgetData();
    } catch (error) {
      toast.error("Gagal membuat periode alokasi");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!budgetPeriod) return;
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = async () => {
    // Step 1: Open final confirmation
    setIsResetFinalConfirmOpen(true);
  };

  const handleConfirmResetFinal = async () => {
    if (!budgetPeriod) return;
    
    setLoading(true);
    try {
      await upsertBudgetItems(budgetPeriod.id, []);
      toast.success("Alokasi berhasil dikosongkan");
      fetchBudgetData();
    } catch (error) {
      toast.error("Gagal mengosongkan alokasi");
    } finally {
      setLoading(false);
      setIsResetFinalConfirmOpen(false);
    }
  };

  const budgetStats = useMemo(() => {
    if (!budgetPeriod) return { totalBudget: 0, totalSpent: 0 };
    
    let totalBudget = 0;
    let totalSpent = 0;

    budgetPeriod.items.forEach((item: any) => {
      totalBudget += item.amount;
      totalSpent += categoryExpenses[item.categoryId] || 0;
    });

    return { totalBudget, totalSpent };
  }, [budgetPeriod, categoryExpenses]);

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in text-left pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">Alokasi Dana 🎯</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium mt-1">
            Atur batas pengeluaran per kategori untuk mengontrol keuangan Anda.
          </p>
        </div>

        <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 md:gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-1 rounded-[20px] md:rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm w-full sm:w-auto justify-center">
            <div className="flex p-0.5 md:p-1 bg-white dark:bg-gray-800/50 rounded-lg md:rounded-xl shadow-sm border border-gray-100/50 dark:border-gray-700/50">
              <button
                onClick={() => setViewMode("monthly")}
                className={`text-[8px] md:text-[9px] px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Bln
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`text-[8px] md:text-[9px] px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'yearly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Thn
              </button>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1 pr-1 md:pr-2">
              <button onClick={() => changePeriod(-1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
              <div className="px-1 md:px-2 min-w-[80px] md:min-w-[120px] text-center">
                <span className="font-bold text-[10px] md:text-xs text-gray-900 dark:text-white tracking-tight uppercase whitespace-nowrap">
                  {viewMode === "monthly" ? format(currentDate, "MMM yyyy", { locale: id }) : format(currentDate, "yyyy", { locale: id })}
                </span>
              </div>
              <button onClick={() => changePeriod(1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronRight className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 md:h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : !budgetPeriod ? (
        <GlassCard className="p-8 md:p-16 text-center flex flex-col items-center gap-6 bg-white dark:bg-gray-900/40 border-dashed border-2 border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">Belum ada alokasi bulan ini</h3>
            <p className="text-xs md:text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">Mulai atur budget pengeluaran Anda untuk bulan {format(currentDate, "MMMM", { locale: id })}.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <button 
              onClick={() => handleCreatePeriod(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
              <Copy className="w-4 h-4" /> <span>Salin Sebelumnya</span>
            </button>
            <button 
              onClick={() => handleCreatePeriod(false)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> <span>Buat Baru</span>
            </button>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <GlassCard className="p-6 bg-slate-900 text-white border-none relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <PieChart className="w-16 md:w-20 h-16 md:h-20" />
               </div>
               <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Total Alokasi</p>
               <h3 className="text-2xl md:text-3xl font-black">Rp {budgetStats.totalBudget.toLocaleString("id-ID")}</h3>
            </GlassCard>
            <GlassCard className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
               <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Total Terpakai</p>
               <h3 className="text-2xl md:text-3xl font-black text-rose-600">Rp {budgetStats.totalSpent.toLocaleString("id-ID")}</h3>
            </GlassCard>
            <GlassCard className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 sm:col-span-2 lg:col-span-1">
               <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Sisa Anggaran</p>
               <h3 className="text-2xl md:text-3xl font-black text-emerald-600">Rp {Math.max(0, budgetStats.totalBudget - budgetStats.totalSpent).toLocaleString("id-ID")}</h3>
            </GlassCard>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2 pt-4">
            <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              Detail Anggaran
            </h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={handleReset}
                className="flex-1 sm:flex-none p-3 text-gray-400 hover:text-rose-500 transition-all rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-gray-100 dark:border-gray-800 sm:border-none flex items-center justify-center"
                title="Kosongkan Alokasi"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex-[4] sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 whitespace-nowrap"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Alokasi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {budgetPeriod.items.map((item: any) => {
              const spent = categoryExpenses[item.categoryId] || 0;
              const remaining = item.amount - spent;
              const progress = Math.min((spent / item.amount) * 100, 100);
              const isOver = spent > item.amount;

              return (
                <GlassCard key={item.id} className={`p-5 md:p-6 transition-all hover:translate-y-[-4px] ${isOver ? 'border-rose-200 dark:border-rose-900/30' : 'border-gray-100 dark:border-gray-800'}`}>
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className="flex-1">
                      <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kategori</p>
                      <h4 className="text-base md:text-lg font-black text-gray-900 dark:text-white tracking-tight leading-tight">{item.categoryName}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Budget</p>
                      <p className="font-black text-gray-900 dark:text-white text-sm md:text-base">Rp {item.amount.toLocaleString("id-ID")}</p>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-end">
                      <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isOver ? 'text-rose-500' : 'text-gray-400'}`}>
                        {isOver ? 'Over Budget!' : 'Pemakaian'}
                      </span>
                      <span className={`text-xs md:text-sm font-black ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2.5 md:h-3 bg-gray-100 dark:bg-gray-800/50 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-gray-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold">
                       <div className="flex flex-col">
                          <span className="text-gray-400 uppercase text-[8px] md:text-[9px] mb-0.5">Terpakai</span>
                          <span className="text-gray-700 dark:text-gray-300">Rp {spent.toLocaleString("id-ID")}</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-gray-400 uppercase text-[8px] md:text-[9px] mb-0.5">Sisa</span>
                          <span className={remaining < 0 ? "text-rose-600" : "text-emerald-600"}>
                            {remaining < 0 ? '-' : ''}Rp {Math.abs(remaining).toLocaleString("id-ID")}
                          </span>
                       </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}

            {budgetPeriod.items.length === 0 && (
              <div className="sm:col-span-2 py-16 md:py-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
                <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-xs md:text-sm text-gray-500 font-bold">Belum ada kategori yang dialokasikan.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 text-emerald-600 font-black text-[10px] md:text-xs uppercase tracking-widest hover:underline"
                >
                  Tambah Kategori Sekarang
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {isModalOpen && budgetPeriod && (
        <BudgetActionModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          periodId={budgetPeriod.id}
          allCategories={allCategories.filter(c => c.type === 'EXPENSE')}
          existingItems={budgetPeriod.items}
          onSuccess={fetchBudgetData}
        />
      )}
      
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Kosongkan Alokasi?"
        message="Apakah Anda yakin ingin menghapus semua alokasi dana untuk bulan ini?"
        confirmText="Ya, Kosongkan"
        variant="warning"
      />

      <ConfirmationModal
        isOpen={isResetFinalConfirmOpen}
        onClose={() => setIsResetFinalConfirmOpen(false)}
        onConfirm={handleConfirmResetFinal}
        title="Peringatan Terakhir! ⚠️"
        message="Tindakan ini akan menghapus seluruh data anggaran yang sudah Anda susun. Anda benar-benar yakin ingin melanjutkannya?"
        confirmText="Ya, Saya Yakin"
        variant="danger"
      />
    </div>
  );
}
