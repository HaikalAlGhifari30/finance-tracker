"use client";

import { useState, useMemo } from "react";
import { format, isSameMonth, isSameYear, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, Trophy, Sparkles,
  CreditCard, Calendar, List, ChevronLeft, ChevronRight, Star, Landmark, Smartphone, Banknote, Plus
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import ActivityLogClient from "./ActivityLogClient";
import { ACCOUNT_ICONS } from "@/lib/constants";

interface DashboardClientPageProps {
  initialActivities: any[];
  user: { name: string | null };
  mainGoal?: any;
  totalAssets: number;
  totalSavingsPool: number;
  accounts: any[];
}

export default function DashboardClientPage({ initialActivities, user, mainGoal, totalAssets: overallTotalAssets, totalSavingsPool, accounts }: DashboardClientPageProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());

  const changePeriod = (amount: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "monthly") {
      newDate.setMonth(newDate.getMonth() + amount);
    } else {
      newDate.setFullYear(newDate.getFullYear() + amount);
    }
    setCurrentDate(newDate);
  };

  const filteredActivities = useMemo(() => {
    return initialActivities.filter((activity) => {
      const activityDate = typeof activity.date === 'string' ? parseISO(activity.date) : new Date(activity.date);
      if (viewMode === "monthly") {
        return isSameMonth(activityDate, currentDate) && isSameYear(activityDate, currentDate);
      } else {
        return isSameYear(activityDate, currentDate);
      }
    });
  }, [initialActivities, viewMode, currentDate]);

  // Calculate all stats for the selected period
  const stats = useMemo(() => {
    let periodIncome = 0;
    let periodExpense = 0;

    filteredActivities.forEach((act) => {
      const amount = Number(act.amount);
      if (act.type === "INCOME") {
        periodIncome += amount;
      } else if (act.type === "EXPENSE") {
        periodExpense += amount;
      }
    });

    return {
      income: periodIncome,
      expense: periodExpense,
      net: periodIncome - periodExpense
    };
  }, [filteredActivities]);

  const getAccountIcon = (name: string, type: string) => {
    return ACCOUNT_ICONS[name.toUpperCase()] || ACCOUNT_ICONS[type] || ACCOUNT_ICONS.DEFAULT;
  };

  return (
    <>
      {/* DESKTOP LAYOUT */}
      <div className="hidden md:block space-y-8 md:space-y-12 animate-fade-in text-left pb-10">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
        <div className="text-center xl:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">Halo, {user.name}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-sm md:text-base">
            Pantau perkembangan aset dan rekening Anda <span className="text-slate-900 dark:text-slate-200 font-bold">
              {viewMode === "monthly" ? format(currentDate, "MMMM yyyy", { locale: id }) : format(currentDate, "yyyy", { locale: id })}
            </span>.
          </p>
        </div>

        <div className="flex flex-col items-center xl:items-end gap-3">
          <div className="text-[10px] md:text-[11px] font-black text-gray-400 bg-white dark:bg-[#1E1E2D] px-4 md:px-6 py-2.5 md:py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 uppercase tracking-widest flex items-center gap-3">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-1 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm w-full md:w-auto">
            <div className="flex p-1 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100/50 dark:border-gray-700/50">
              <button
                onClick={() => setViewMode("monthly")}
                className={`text-[9px] px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Bln
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`text-[9px] px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'yearly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Thn
              </button>
            </div>

            <div className="flex items-center gap-1 pr-1 md:pr-2">
              <button onClick={() => changePeriod(-1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" /></button>
              <div className="px-1 md:px-2 min-w-[100px] md:min-w-[120px] text-center">
                <span className="font-bold text-[10px] md:text-xs text-gray-900 dark:text-white tracking-tight uppercase">
                  {viewMode === "monthly" ? format(currentDate, "MMM yyyy", { locale: id }) : format(currentDate, "yyyy", { locale: id })}
                </span>
              </div>
              <button onClick={() => changePeriod(1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Saldo */}
        <GlassCard className="lg:col-span-2 p-6 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-800 shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 md:p-6 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500">
            <Sparkles className="w-24 md:w-32 h-24 md:h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-6 md:gap-10 text-center md:text-left">
            <div>
              <p className="text-slate-400 text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] mb-1">Total Aset (Rekening + Tabungan)</p>
              <h3 className={`text-3xl md:text-5xl font-black tracking-tighter ${overallTotalAssets < 0 ? 'text-rose-400' : 'text-white'}`}>
                Rp {overallTotalAssets.toLocaleString("id-ID")}
              </h3>
              <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2 md:gap-4 mt-4 md:mt-3">
                <p className="text-slate-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest">Saldo Liquid: Rp {(overallTotalAssets - totalSavingsPool).toLocaleString("id-ID")}</p>
                <div className="hidden md:block w-1 h-1 bg-slate-700 rounded-full" />
                <p className="text-amber-500/80 text-[8px] md:text-[9px] font-black uppercase tracking-widest">Tabungan: Rp {totalSavingsPool.toLocaleString("id-ID")}</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
               <Link href="/dashboard/accounts" className="flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest text-white shadow-xl backdrop-blur-md">
                 Rekening & Transfer <ArrowRight className="w-3 h-3" />
               </Link>
            </div>
          </div>
        </GlassCard>

        {/* Total Pemasukan - BLUE */}
        <Link href="/dashboard/income" className="block h-full">
          <GlassCard className="h-full p-6 md:p-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20 shadow-sm relative group hover:scale-[1.01] transition-all duration-300 cursor-pointer flex flex-col items-center md:items-start text-center md:text-left">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <TrendingUp className="w-5 md:w-6 h-5 md:h-6 text-blue-600" />
            </div>
            <p className="text-blue-900/40 dark:text-blue-400/40 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Pemasukan ({viewMode === "monthly" ? "Bulan Ini" : "Tahun Ini"})</p>
            <h3 className="text-xl md:text-2xl font-black text-blue-600">Rp {stats.income.toLocaleString("id-ID")}</h3>
          </GlassCard>
        </Link>

        {/* Total Pengeluaran - ORANGE */}
        <Link href="/dashboard/expenses" className="block h-full">
          <GlassCard className="h-full p-6 md:p-8 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-800/20 shadow-sm relative group hover:scale-[1.01] transition-all duration-300 cursor-pointer flex flex-col items-center md:items-start text-center md:text-left">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <TrendingDown className="w-5 md:w-6 h-5 md:h-6 text-orange-600" />
            </div>
            <p className="text-orange-900/40 dark:text-orange-400/40 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Pengeluaran ({viewMode === "monthly" ? "Bulan Ini" : "Tahun Ini"})</p>
            <h3 className="text-xl md:text-2xl font-black text-orange-600">Rp {stats.expense.toLocaleString("id-ID")}</h3>
          </GlassCard>
        </Link>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daftar Saldo Rekening */}
        <GlassCard className="lg:col-span-2 p-8 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-500">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                <Wallet className="w-6 h-6 text-emerald-500" />
                Daftar Saldo Rekening
              </h3>
              <Link href="/dashboard/accounts" className="text-xs font-black text-emerald-600 hover:underline uppercase tracking-widest">
                Detail
              </Link>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.length === 0 ? (
                <div className="col-span-2 py-8 text-center bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                   <p className="text-sm font-bold text-gray-400">Belum ada rekening terdaftar</p>
                </div>
              ) : (
                accounts.slice(0, 4).map((acc) => {
                  const config = getAccountIcon(acc.name, acc.type);
                  const Icon = config.icon;
                  return (
                    <div key={acc.id} className="flex items-center gap-4 p-4 bg-white/60 dark:bg-gray-900/40 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 hover:border-emerald-500/30 transition-all group shadow-sm">
                       <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" style={{ color: config.color }} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{acc.name}</p>
                          <p className="text-lg font-black text-gray-800 dark:text-gray-100 tracking-tight truncate">
                             Rp {acc.balance.toLocaleString('id-ID')}
                          </p>
                       </div>
                    </div>
                  )
                })
              )}
           </div>
        </GlassCard>

        {/* Goal Card or Health Card */}
        {mainGoal ? (
          (() => {
            const isCompleted = Number(mainGoal.balance) >= Number(mainGoal.targetAmount);
            const progress = Math.min((Number(mainGoal.balance) / Number(mainGoal.targetAmount)) * 100, 100);
            
            return (
              <Link href="/dashboard/savings">
                <GlassCard className={`h-full p-8 border-none shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all bg-gradient-to-br ${
                  isCompleted 
                    ? 'from-amber-400 to-yellow-600 text-white shadow-amber-500/20' 
                    : 'from-indigo-600 to-violet-700 text-white'
                }`}>
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-120 transition-all">
                        <Trophy className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                       <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCompleted ? 'text-amber-100' : 'text-indigo-200'}`}>Target Prioritas</p>
                          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            {mainGoal.name}
                            {isCompleted && <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />}
                          </h3>
                       </div>

                       {/* New Balance Display */}
                       <div className="space-y-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest block ${isCompleted ? 'text-amber-100' : 'text-indigo-200'}`}>Terkumpul Saat Ini</span>
                          <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-white tracking-tight">Rp {Number(mainGoal.balance).toLocaleString("id-ID")}</span>
                              <span className={`text-[10px] font-bold ${isCompleted ? 'text-amber-100/80' : 'text-indigo-200'}`}>/ Rp {Number(mainGoal.targetAmount).toLocaleString("id-ID")}</span>
                          </div>
                       </div>

                       <div className="mt-auto">
                          <div className={`flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 ${isCompleted ? 'text-amber-100' : 'text-indigo-200'}`}>
                             <span>Progres</span>
                             <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className={`h-2 rounded-full overflow-hidden ${isCompleted ? 'bg-black/10' : 'bg-white/20'}`}>
                             <div 
                               className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-yellow-100 shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'}`}
                               style={{ width: `${progress}%` }}
                             />
                          </div>
                       </div>
                    </div>
                </GlassCard>
              </Link>
            );
          })()
        ) : (
          <GlassCard className="p-6 bg-[#064E3B] border border-emerald-800 shadow-xl shadow-emerald-900/20 group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden text-left">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <Sparkles className="w-24 h-24 text-emerald-400" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h3 className="font-black text-lg text-white tracking-tight">Kesehatan Keuangan</h3>
                  </div>
                  
                  <p className="text-emerald-100/60 text-[11px] leading-relaxed font-medium mb-6 flex-grow">
                      Porsi ideal tabungan adalah <span className="text-emerald-400 font-bold">20%</span> dari pemasukan. Pantau terus stabilitas Anda.
                  </p>
                  
                  <Link href="/dashboard/expenses" className="flex items-center justify-between group/btn bg-emerald-500 hover:bg-emerald-400 transition-all text-white text-[9px] font-black px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 uppercase tracking-widest mt-auto">
                      <span>Catat Transaksi</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
              </div>
          </GlassCard>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Log Aktivitas Keuangan */}
        <GlassCard className="p-0 overflow-hidden flex flex-col shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
            <div>
              <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                <List className="w-6 h-6 text-orange-500" />
                Aktivitas Keuangan
              </h3>
            </div>
          </div>
          <div className="flex-1">
            <ActivityLogClient activities={filteredActivities} />
          </div>
        </GlassCard>
      </div>
    </div>

    {/* MOBILE LAYOUT (Mobile Redesign) */}
      <div className="md:hidden space-y-6 animate-fade-in text-left pb-4 px-1">
        {/* Header (Greeting & Date) */}
        <div className="flex justify-between items-end px-2">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Halo, {user.name}!</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-[11px] tracking-wide mt-1">
              {format(new Date(), "EEEE, dd MMM yyyy", { locale: id })}
            </p>
          </div>
        </div>

        {/* Mobile ATM/Bank Card */}
        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl shadow-slate-900/30 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Total Aset Bersih</p>
              <h3 className={`text-3xl font-black tracking-tighter ${overallTotalAssets < 0 ? 'text-rose-400' : 'text-white'}`}>
                Rp {overallTotalAssets.toLocaleString("id-ID")}
              </h3>
            </div>
            
            <div className="flex gap-4 items-center bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
               <div className="flex-1">
                 <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Saldo Liquid</p>
                 <p className="text-xs font-bold mt-1 text-slate-100">Rp {(overallTotalAssets - totalSavingsPool).toLocaleString("id-ID")}</p>
               </div>
               <div className="w-px h-8 bg-slate-700"></div>
               <div className="flex-1">
                 <p className="text-amber-500/80 text-[8px] font-black uppercase tracking-widest">Tabungan</p>
                 <p className="text-xs font-bold mt-1 text-amber-100">Rp {totalSavingsPool.toLocaleString("id-ID")}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-5 gap-y-6 gap-x-2 px-1 py-4">
          <Link href="/dashboard/accounts" className="flex flex-col items-center gap-2 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center active:scale-95 transition-all">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-400 line-clamp-1">Rekening</span>
          </Link>
          <Link href="/dashboard/income" className="flex flex-col items-center gap-2 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center active:scale-95 transition-all">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-400 line-clamp-1">Masuk</span>
          </Link>
          <Link href="/dashboard/budget" className="flex flex-col items-center gap-2 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center active:scale-95 transition-all">
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-400 line-clamp-1">Alokasi</span>
          </Link>
          <Link href="/dashboard/expenses" className="flex flex-col items-center gap-2 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center active:scale-95 transition-all">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-400 line-clamp-1">Keluar</span>
          </Link>
          <Link href="/dashboard/savings" className="flex flex-col items-center gap-2 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[18px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center active:scale-95 transition-all">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-400 line-clamp-1">Tabungan</span>
          </Link>
        </div>

        {/* Ringkasan Bulanan (Compact) */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/income" className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20 shadow-sm flex flex-col justify-center active:scale-95 transition-all">
            <div className="text-blue-900/40 dark:text-blue-400/40 text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-500 flex items-center justify-center"><TrendingUp className="w-2.5 h-2.5" /></div>
              Pemasukan
            </div>
            <h3 className="text-xs font-black text-blue-600">Rp {stats.income.toLocaleString("id-ID")}</h3>
          </Link>
          <Link href="/dashboard/expenses" className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-800/20 shadow-sm flex flex-col justify-center active:scale-95 transition-all">
            <div className="text-rose-900/40 dark:text-rose-400/40 text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-500 flex items-center justify-center"><TrendingDown className="w-2.5 h-2.5" /></div>
              Pengeluaran
            </div>
            <h3 className="text-xs font-black text-rose-600">Rp {stats.expense.toLocaleString("id-ID")}</h3>
          </Link>
        </div>

        {/* Progress Tabungan (Mobile simplified) */}
        {mainGoal && (
          <Link href="/dashboard/savings" className="block active:scale-[0.98] transition-transform">
            <div className={`p-5 rounded-2xl relative overflow-hidden bg-gradient-to-br ${Number(mainGoal.balance) >= Number(mainGoal.targetAmount) ? 'from-amber-400 to-yellow-600' : 'from-indigo-600 to-violet-700'}`}>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${Number(mainGoal.balance) >= Number(mainGoal.targetAmount) ? 'text-amber-100' : 'text-indigo-200'}`}>Target Aktif</p>
                     <h3 className="text-sm font-bold text-white">{mainGoal.name}</h3>
                   </div>
                   <Trophy className="w-6 h-6 text-white/50" />
                 </div>
                 
                 <div className={`h-1.5 rounded-full overflow-hidden ${Number(mainGoal.balance) >= Number(mainGoal.targetAmount) ? 'bg-black/10' : 'bg-white/20'}`}>
                    <div 
                      className={`h-full transition-all duration-1000 ${Number(mainGoal.balance) >= Number(mainGoal.targetAmount) ? 'bg-yellow-100' : 'bg-white'}`}
                      style={{ width: `${Math.min((Number(mainGoal.balance) / Number(mainGoal.targetAmount)) * 100, 100)}%` }}
                    />
                 </div>
                 <div className={`mt-2 flex justify-between text-[9px] font-bold tracking-widest ${Number(mainGoal.balance) >= Number(mainGoal.targetAmount) ? 'text-amber-100' : 'text-indigo-200'}`}>
                    <span>Rp {Number(mainGoal.balance).toLocaleString("id-ID")}</span>
                    <span>{Math.min((Number(mainGoal.balance) / Number(mainGoal.targetAmount)) * 100, 100).toFixed(0)}%</span>
                 </div>
               </div>
            </div>
          </Link>
        )}

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800/40 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
           <div className="flex justify-between items-center mb-5">
             <h3 className="font-black text-sm text-gray-900 dark:text-gray-100 tracking-tight">Riwayat Terakhir</h3>
             <Link href="/dashboard/expenses" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Lihat Semua</Link>
           </div>
           
           <div className="space-y-4">
             {filteredActivities.slice(0, 5).map((act, i) => (
               <div key={i} className="flex items-center justify-between gap-3">
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${act.type === 'INCOME' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                     {act.type === 'INCOME' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                   </div>
                   <div>
                     <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight mb-0.5 line-clamp-1">{act.description}</p>
                     <p className="text-[9px] text-gray-400 font-medium tracking-wide uppercase">{format(new Date(act.date), "dd MMM", { locale: id })} • {act.categoryName}</p>
                   </div>
                 </div>
                 <span className={`text-xs font-black whitespace-nowrap ${act.type === 'INCOME' ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100'}`}>
                   {act.type === 'INCOME' ? '+' : '-'}Rp {Number(act.amount).toLocaleString("id-ID")}
                 </span>
               </div>
             ))}
             {filteredActivities.length === 0 && (
               <div className="text-center py-6 text-gray-400 text-xs font-bold">
                 Belum ada transaksi
               </div>
             )}
           </div>
        </div>
      </div>

      {/* FAB Mobile */}
      <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+24px)] right-6 z-50">
         <Link href="/dashboard/expenses">
            <button className="w-14 h-14 bg-gradient-to-br from-rose-400 to-red-500 text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-rose-500/40 hover:from-rose-500 hover:to-red-600 active:scale-90 transition-all">
               <Plus className="w-6 h-6" />
            </button>
         </Link>
      </div>
    </>
  );
}
