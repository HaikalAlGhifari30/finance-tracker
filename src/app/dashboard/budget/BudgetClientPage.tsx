"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Target,
  Wallet,
  PiggyBank,
  ArrowUpRight
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getBudgetPeriod, createBudgetPeriod, getCategoryExpensesForPeriod, upsertBudgetItems, deleteBudgetPeriod, getBudgetPeriodSavings } from "@/app/actions/budget";
import BudgetActionModal from "./BudgetActionModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { MemberFilter } from "@/components/MemberFilter";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { formatRupiah, unformatRupiah } from "@/lib/format";

interface BudgetClientPageProps {
  allCategories: any[];
  initialMonth: string;
  initialYear: string;
  members: any[];
  accounts: any[];
}

export default function BudgetClientPage({ allCategories, initialMonth, initialYear, members, accounts }: BudgetClientPageProps) {
  const searchParams = useSearchParams();
  const currentMember = useMemo(() => {
    const memParam = searchParams.get("member");
    if (!memParam || memParam === "all") {
      return members[0]?.id || "";
    }
    return memParam;
  }, [searchParams, members]);
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [currentDate, setCurrentDate] = useState(new Date(parseInt(initialYear), parseInt(initialMonth) - 1));
  const [budgetPeriod, setBudgetPeriod] = useState<any>(null);
  const [categoryExpenses, setCategoryExpenses] = useState<Record<string, number>>({});
  const [netSavings, setNetSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetFinalConfirmOpen, setIsResetFinalConfirmOpen] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateAmount, setGenerateAmount] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      const targetMemberId = currentMember === "all" ? undefined : currentMember;
      const [period, expenses, savingsData] = await Promise.all([
        getBudgetPeriod(monthStr, yearStr, targetMemberId),
        getCategoryExpensesForPeriod(monthStr, yearStr, targetMemberId),
        getBudgetPeriodSavings(monthStr, yearStr, targetMemberId)
      ]);
      setBudgetPeriod(period);
      setCategoryExpenses(expenses);
      setNetSavings((savingsData?.totalSavings || 0) - (savingsData?.totalWithdrawals || 0));
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
  }, [currentDate, viewMode, currentMember]);

  const availableBalance = useMemo(() => {
    return accounts
      .filter(acc => acc.memberId === currentMember)
      .reduce((sum, acc) => sum + Number(acc.balance), 0);
  }, [accounts, currentMember]);

  const handleCreatePeriod = async (copy: boolean, initialTotalBudget: number = 0, autoGenerate: boolean = false) => {
    setLoading(true);
    try {
      const targetMemberId = currentMember === "all" ? undefined : currentMember;
      const periodId = await createBudgetPeriod(monthStr, yearStr, copy, targetMemberId, initialTotalBudget);
      
      if (autoGenerate) {
        const expenseCategories = allCategories.filter(c => c.type === 'EXPENSE');
        if (expenseCategories.length > 0) {
          const amountPerCategory = Math.floor(initialTotalBudget / expenseCategories.length);
          const itemsToCreate = expenseCategories.map((cat, idx) => {
            const amount = idx === expenseCategories.length - 1
              ? initialTotalBudget - (amountPerCategory * (expenseCategories.length - 1))
              : amountPerCategory;
            return { categoryId: cat.id, amount };
          });
          await upsertBudgetItems(periodId, itemsToCreate);
        }
      }
      
      toast.success(
        copy ? "Alokasi berhasil disalin" : 
        autoGenerate ? "Alokasi otomatis berhasil dibuat" : 
        "Periode alokasi baru dibuat"
      );
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
      await deleteBudgetPeriod(budgetPeriod.id);
      toast.success("Alokasi berhasil dikosongkan");
      fetchBudgetData();
    } catch (error) {
      toast.error("Gagal mengosongkan alokasi");
    } finally {
      setLoading(false);
      setIsResetFinalConfirmOpen(false);
      setIsResetConfirmOpen(false);
    }
  };

  const budgetStats = useMemo(() => {
    const totalBudget = budgetPeriod?.totalBudget || 0;
    let totalSpent = 0;

    if (budgetPeriod) {
      budgetPeriod.items.forEach((item: any) => {
        totalSpent += categoryExpenses[item.categoryId] || 0;
      });
    }

    return { totalBudget, totalSpent };
  }, [budgetPeriod, categoryExpenses]);


  const allocatedSum = useMemo(() => {
    if (!budgetPeriod) return 0;
    return budgetPeriod.items.reduce((sum: number, item: any) => sum + item.amount, 0);
  }, [budgetPeriod]);

  // Budget Alokasi = totalBudget minus only savings explicitly from budget ([DARI_BUDGET])
  const adjustedTotalBudget = useMemo(() => {
    return Math.max(0, (budgetPeriod?.totalBudget || 0) - netSavings);
  }, [budgetPeriod?.totalBudget, netSavings]);

  // Proportionally scale each category's budget amount to match adjustedTotalBudget
  // so the category list total is always consistent with the budget summary card
  const adjustedItems = useMemo(() => {
    if (!budgetPeriod) return [];
    if (allocatedSum === 0 || adjustedTotalBudget === 0) return budgetPeriod.items;

    const scale = adjustedTotalBudget / allocatedSum;
    let distributed = 0;

    return budgetPeriod.items.map((item: any, idx: number) => {
      const isLast = idx === budgetPeriod.items.length - 1;
      let adjustedAmount: number;

      if (isLast) {
        adjustedAmount = Math.max(0, adjustedTotalBudget - distributed);
      } else {
        adjustedAmount = Math.round((item.amount * scale) / 1000) * 1000;
        if (adjustedAmount < 0) adjustedAmount = 0;
        distributed += adjustedAmount;
      }

      return { ...item, amount: adjustedAmount };
    });
  }, [budgetPeriod, allocatedSum, adjustedTotalBudget]);

  const allocatedPercent = useMemo(() => {
    if (adjustedTotalBudget === 0) return 0;
    return Math.min((allocatedSum / adjustedTotalBudget) * 100, 100);
  }, [allocatedSum, adjustedTotalBudget]);

  const unallocatedAmount = useMemo(() => {
    return Math.max(0, availableBalance - adjustedTotalBudget);
  }, [availableBalance, adjustedTotalBudget]);

  const unallocatedPercent = useMemo(() => {
    if (adjustedTotalBudget === 0) return 0;
    return Math.min((unallocatedAmount / adjustedTotalBudget) * 100, 100);
  }, [unallocatedAmount, adjustedTotalBudget]);

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("makan") || lower.includes("minum") || lower.includes("food")) return "🍚";
    if (lower.includes("kos") || lower.includes("rumah") || lower.includes("kontrak") || lower.includes("sewa")) return "🏠";
    if (lower.includes("trans") || lower.includes("ojek") || lower.includes("bensin") || lower.includes("mobil") || lower.includes("motor")) return "🚗";
    if (lower.includes("listrik") || lower.includes("air") || lower.includes("wifi") || lower.includes("tagihan")) return "⚡";
    if (lower.includes("jajan") || lower.includes("cemilan") || lower.includes("snack")) return "🍡";
    if (lower.includes("skincare") || lower.includes("makeup") || lower.includes("cantik")) return "✨";
    return "📦";
  };

  const getCategoryColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("makan")) return "bg-amber-500/10 text-amber-500";
    if (lower.includes("kos")) return "bg-blue-500/10 text-blue-500";
    if (lower.includes("trans")) return "bg-purple-500/10 text-purple-500";
    if (lower.includes("listrik") || lower.includes("tagihan")) return "bg-yellow-500/10 text-yellow-500";
    if (lower.includes("skincare")) return "bg-pink-500/10 text-pink-500";
    return "bg-emerald-500/10 text-emerald-500";
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in text-left pb-10">
      {/* Header Area */}
      <div className="pb-3 border-b border-gray-100 dark:border-gray-800/60">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">Alokasi Dana 🎯</h1>
          <p className="text-xs md:text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">
            Atur batas pengeluaran per kategori untuk mengontrol keuangan Anda.
          </p>
        </div>
      </div>

      {/* Control Action Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-between pb-4 border-b border-gray-100 dark:border-gray-800/60">
        <MemberFilter members={members} className="w-full sm:w-auto" hideAll={true} />
          
          {/* Month Navigation Datepicker */}
          <div className="flex items-center gap-2 md:gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-[20px] md:rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm w-full sm:w-auto justify-center">
            <button onClick={() => changePeriod(-1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
            <div className="px-3 md:px-4 min-w-[100px] md:min-w-[140px] text-center flex items-center justify-center gap-2">
              <span className="font-bold text-[10px] md:text-xs text-gray-900 dark:text-white tracking-tight uppercase whitespace-nowrap">
                {format(currentDate, "MMMM yyyy", { locale: id })}
              </span>
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <button onClick={() => changePeriod(1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronRight className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
          </div>
        </div>

      {/* 🟪 HERO CARD - Hidden as requested */}
      {/*
      <GlassCard className="p-6 md:p-8 bg-[#151521] border border-gray-800/80 rounded-[2rem] flex flex-col md:flex-row justify-between gap-6 md:gap-8 relative overflow-hidden shadow-2xl">
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget Alokasi</p>
            <h3 className="text-3xl md:text-4xl font-black text-white mt-1">Rp {budgetStats.totalBudget.toLocaleString("id-ID")}</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-800/60 rounded-full overflow-hidden p-0.5 border border-gray-700/30">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-1000"
                  style={{ width: `${allocatedPercent}%` }}
                />
              </div>
              <span className="text-sm font-black text-emerald-400 shrink-0">{allocatedPercent.toFixed(0)}%</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Anda telah mengalokasikan {allocatedPercent.toFixed(0)}% dari budget.
            </p>
          </div>
        </div>

        <div className="w-full md:w-64 flex flex-col justify-center pt-6 md:pt-0 md:pl-8 border-t md:border-t-0 md:border-l border-gray-800/80">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum Dialokasikan</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">Rp {unallocatedAmount.toLocaleString("id-ID")}</h3>
          <p className="text-[11px] text-gray-400 mt-1">
            {unallocatedPercent.toFixed(0)}% dari budget
          </p>
        </div>
      </GlassCard>
      */}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <GlassCard className="p-5 bg-white dark:bg-[#1E1E2D]/40 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center gap-4">
          <div className="bg-purple-500/10 text-purple-500 p-3 rounded-2xl shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">Budget Alokasi</p>
            <h4 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">Rp {adjustedTotalBudget.toLocaleString("id-ID")}</h4>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">Total rencana anggaran</p>
          </div>
        </GlassCard>

        <GlassCard className="p-5 bg-white dark:bg-[#1E1E2D]/40 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center gap-4">
          <div className="bg-rose-500/10 text-rose-500 p-3 rounded-2xl shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">Terpakai</p>
            <h4 className="text-lg font-black text-rose-500 mt-0.5">Rp {budgetStats.totalSpent.toLocaleString("id-ID")}</h4>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">Total pengeluaran dari alokasi</p>
          </div>
        </GlassCard>

        <GlassCard className="p-5 bg-white dark:bg-[#1E1E2D]/40 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center gap-4">
          <div className="bg-blue-500/10 text-blue-500 p-3 rounded-2xl shrink-0">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">Sisa Budget</p>
            <h4 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">Rp {Math.max(0, adjustedTotalBudget - budgetStats.totalSpent).toLocaleString("id-ID")}</h4>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">Masih bisa digunakan</p>
          </div>
        </GlassCard>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800/40 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (!budgetPeriod || budgetPeriod.items.length === 0) ? (
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
              onClick={() => handleCreatePeriod(false, 0)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" /> <span>Mulai Kosong</span>
            </button>
            <button 
              onClick={() => handleCreatePeriod(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
              <Copy className="w-4 h-4" /> <span>Gunakan Bulan Lalu</span>
            </button>
            <button 
              onClick={() => {
                setGenerateAmount("");
                setShowGenerateModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> <span>Generate Otomatis</span>
            </button>
          </div>
        </GlassCard>
      ) : (
        <>
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

          {/* Category List - Horizontal Row Cards */}
          <div className="flex flex-col gap-4">
            {adjustedItems.map((item: any) => {
              const spent = categoryExpenses[item.categoryId] || 0;
              const remaining = item.amount - spent;
              const progress = item.amount > 0 ? Math.min((spent / item.amount) * 100, 100) : 0;
              const isOver = spent > item.amount;

              return (
                <GlassCard key={item.id} className={`p-4 md:p-5 bg-white dark:bg-[#1E1E2D]/40 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:translate-y-[-2px] ${isOver ? 'border-rose-500/50 dark:border-rose-500/50' : ''}`}>
                  {/* Category Name */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(item.categoryName)}`}>
                      <span className="text-lg">{getCategoryIcon(item.categoryName)}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">{item.categoryName}</h4>
                    </div>
                  </div>

                  {/* Columns */}
                  <div className="grid grid-cols-3 gap-2 flex-1 max-w-xl">
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase block">Budget</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">Rp {item.amount.toLocaleString("id-ID")}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase block">Terpakai</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">Rp {spent.toLocaleString("id-ID")}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase block">Sisa</span>
                      <span className={`font-bold text-sm ${remaining < 0 ? 'text-rose-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
                        Rp {remaining.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Progress Column */}
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className={`text-xs font-black shrink-0 ${isOver ? 'text-rose-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </GlassCard>
              );
            })}

            {budgetPeriod.items.length === 0 && (
              <div className="py-16 md:py-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
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
          totalBudget={budgetPeriod.totalBudget}
          totalSpent={budgetStats.totalSpent}
          availableBalance={availableBalance}
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

      {/* Generate Otomatis Modal */}
      {showGenerateModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-[12px] animate-in fade-in duration-300" onClick={() => setShowGenerateModal(false)} />
          <GlassCard className="relative w-full max-w-md bg-white dark:bg-[#1E1E2D] p-8 shadow-2xl animate-in zoom-in-95 duration-300 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 text-left">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Generate Alokasi Otomatis</h3>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1 mb-6">Nominal akan dibagi rata ke setiap kategori</p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const amount = Number(unformatRupiah(generateAmount));
              if (!amount || amount <= 0) {
                toast.error("Nominal tidak valid");
                return;
              }
              if (amount > availableBalance) {
                toast.error(`Nominal melebihi saldo tersedia (Tersedia: Rp ${availableBalance.toLocaleString("id-ID")})`);
                return;
              }
              setShowGenerateModal(false);
              await handleCreatePeriod(false, amount, true);
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nominal yang Ingin Dialokasikan (Rp)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={generateAmount}
                  onChange={(e) => setGenerateAmount(formatRupiah(e.target.value))}
                  placeholder="Contoh: 4.000.000"
                  className="w-full bg-gray-50 dark:bg-gray-900 rounded-2xl px-5 py-4 text-lg font-black text-emerald-600 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Generate
                </button>
              </div>
            </form>
          </GlassCard>
        </div>,
        document.body
      )}
    </div>
  );
}
