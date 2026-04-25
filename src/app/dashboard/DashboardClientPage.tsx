"use client";

import { useState, useMemo } from "react";
import { format, isSameMonth, isSameYear, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, Trophy, Sparkles,
  CreditCard, Calendar, List, ChevronLeft, ChevronRight, Star, Landmark, Smartphone, Banknote
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
    <div className="space-y-12 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Halo, {user.name}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
            Pantau perkembangan aset dan rekening Anda <span className="text-slate-900 dark:text-slate-200 font-bold">
              {viewMode === "monthly" ? format(currentDate, "MMMM yyyy", { locale: id }) : format(currentDate, "yyyy", { locale: id })}
            </span>.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-[11px] font-black text-gray-400 bg-white dark:bg-[#1E1E2D] px-6 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 uppercase tracking-widest flex items-center gap-3">
            <Calendar className="w-4 h-4 text-emerald-500" />
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-1 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex p-1 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100/50 dark:border-gray-700/50">
              <button
                onClick={() => setViewMode("monthly")}
                className={`text-[9px] px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Bln
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`text-[9px] px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all ${viewMode === 'yearly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Thn
              </button>
            </div>

            <div className="flex items-center gap-1 pr-2">
              <button onClick={() => changePeriod(-1)} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
              <div className="px-2 min-w-[120px] text-center">
                <span className="font-bold text-xs text-gray-900 dark:text-white tracking-tight uppercase">
                  {viewMode === "monthly" ? format(currentDate, "MMM yyyy", { locale: id }) : format(currentDate, "yyyy", { locale: id })}
                </span>
              </div>
              <button onClick={() => changePeriod(1)} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Saldo */}
        <GlassCard className="lg:col-span-2 p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-10">
            <div>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Total Aset (Rekening + Tabungan)</p>
              <h3 className={`text-5xl font-black tracking-tighter ${overallTotalAssets < 0 ? 'text-rose-400' : 'text-white'}`}>
                Rp {overallTotalAssets.toLocaleString("id-ID")}
              </h3>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Saldo Liquid: Rp {(overallTotalAssets - totalSavingsPool).toLocaleString("id-ID")}</p>
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <p className="text-amber-500/80 text-[9px] font-black uppercase tracking-widest">Tabungan: Rp {totalSavingsPool.toLocaleString("id-ID")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Link href="/dashboard/accounts" className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all font-black text-[10px] uppercase tracking-widest text-white shadow-xl backdrop-blur-md">
                 Rekening & Transfer <ArrowRight className="w-3 h-3" />
               </Link>
            </div>
          </div>
        </GlassCard>

        {/* Total Pemasukan - BLUE */}
        <Link href="/dashboard/income" className="block">
          <GlassCard className="h-full p-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20 shadow-sm relative group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-blue-900/40 dark:text-blue-400/40 text-[10px] font-black uppercase tracking-widest mb-1">Pemasukan ({viewMode === "monthly" ? "Bulan Ini" : "Tahun Ini"})</p>
            <h3 className="text-2xl font-black text-blue-600">Rp {stats.income.toLocaleString("id-ID")}</h3>
          </GlassCard>
        </Link>

        {/* Total Pengeluaran - ORANGE */}
        <Link href="/dashboard/expenses" className="block">
          <GlassCard className="h-full p-8 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-800/20 shadow-sm relative group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-orange-900/40 dark:text-orange-400/40 text-[10px] font-black uppercase tracking-widest mb-1">Pengeluaran ({viewMode === "monthly" ? "Bulan Ini" : "Tahun Ini"})</p>
            <h3 className="text-2xl font-black text-orange-600">Rp {stats.expense.toLocaleString("id-ID")}</h3>
          </GlassCard>
        </Link>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daftar Saldo Rekening */}
        <GlassCard className="lg:col-span-2 p-8 bg-emerald-50/40 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/20 shadow-lg shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-500">
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
                    <div key={acc.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800/50 hover:border-emerald-500/30 transition-all group">
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
          <Link href="/dashboard/savings">
            <GlassCard className="h-full p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-120 transition-all">
                    <Trophy className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                   <div>
                      <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Target Prioritas</p>
                      <h3 className="text-2xl font-black text-white tracking-tight">{mainGoal.name}</h3>
                   </div>
                   <div className="mt-8">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">
                         <span>Progres</span>
                         <span>{Math.min((Number(mainGoal.balance) / Number(mainGoal.targetAmount)) * 100, 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000"
                           style={{ width: `${Math.min((Number(mainGoal.balance) / Number(mainGoal.targetAmount)) * 100, 100)}%` }}
                         />
                      </div>
                   </div>
                </div>
            </GlassCard>
          </Link>
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
  );
}
