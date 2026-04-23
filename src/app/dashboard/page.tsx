import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/db";
import { expenses, income, categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, sql, and } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TrendingUp, TrendingDown, Wallet, ArrowRight, Trophy, Sparkles, CreditCard, Calendar, List } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import ActivityLogClient from "./ActivityLogClient";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // 1. Fetch Totals
  const [incomeResult] = await db
    .select({ total: sql<string>`sum(${income.amount})` })
    .from(income)
    .where(eq(income.userId, userId))
    .execute();

  const [expenseMainResult] = await db
    .select({ total: sql<string>`sum(${expenses.amount})` })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), eq(expenses.source, 'MAIN')))
    .execute();

  const [expenseSavingsResult] = await db
    .select({ total: sql<string>`sum(${expenses.amount})` })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), eq(expenses.source, 'SAVINGS')))
    .execute();

  // Get Tabungan Category ID
  const tabunganCat = await db.select().from(categories).where(
    and(
        eq(categories.userId, userId),
        sql`lower(${categories.name}) = 'tabungan'`
    )
  ).execute();
  const tabunganCatId = tabunganCat[0]?.id;

  const [savingsInflowResult] = tabunganCatId ? await db
    .select({ total: sql<string>`sum(${expenses.amount})` })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), eq(expenses.categoryId, tabunganCatId), eq(expenses.source, 'MAIN')))
    .execute() : [{ total: '0' }];

  const totalIncome = Number(incomeResult?.total || 0);
  const totalExpenseMain = Number(expenseMainResult?.total || 0);
  const totalExpenseSavings = Number(expenseSavingsResult?.total || 0);
  const totalSavingsInflow = Number(savingsInflowResult?.total || 0);

  // LOGIC:
  // Main Balance = Total Income - Total Expense from Main (which includes Savings deposits)
  const mainBalance = totalIncome - totalExpenseMain;
  // Total Savings = All deposits into savings - All withdrawals from savings
  const totalSavings = totalSavingsInflow - totalExpenseSavings;
  // Total Asset = All money available
  const totalAssets = mainBalance + totalSavings;

  // 2. Fetch Recent Activities (Combined Income & Expenses)
  const recentExpenses = await db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      description: expenses.description,
      date: expenses.date,
      type: sql<string>`'EXPENSE'`,
      source: expenses.source,
      categoryName: categories.name
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(eq(expenses.userId, userId))
    .orderBy(desc(expenses.date))
    .limit(500)
    .execute();

  const recentIncomes = await db
    .select({
      id: income.id,
      amount: income.amount,
      description: income.description,
      date: income.date,
      type: sql<string>`'INCOME'`,
      source: sql<string>`'MAIN'`,
      categoryName: categories.name
    })
    .from(income)
    .innerJoin(categories, eq(income.categoryId, categories.id))
    .where(eq(income.userId, userId))
    .orderBy(desc(income.date))
    .limit(500)
    .execute();

  const combinedActivities = [...recentExpenses, ...recentIncomes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-12 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Halo, {session.user.name}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Pantau perkembangan aset dan tabungan Anda hari ini.</p>
        </div>
        <div className="text-[11px] font-black text-gray-400 bg-white dark:bg-[#1E1E2D] px-6 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 uppercase tracking-widest flex items-center gap-3">
           <Calendar className="w-4 h-4 text-emerald-500" />
           {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Aset - Dark Neutral Navy/Charcoal */}
        <GlassCard className="lg:col-span-2 p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500">
              <Sparkles className="w-32 h-32" />
           </div>
           <div className="relative z-10 flex flex-col h-full justify-between gap-10">
              <div>
                <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Total Aset Keseluruhan</p>
                <h3 className={`text-5xl font-black tracking-tighter ${totalAssets < 0 ? 'text-rose-400' : 'text-white'}`}>
                    Rp {totalAssets.toLocaleString("id-ID")}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex-1 bg-slate-800/50 px-5 py-4 rounded-2xl border border-slate-700/50">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Saldo Utama</p>
                    <p className={`font-bold text-sm ${mainBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        Rp {mainBalance.toLocaleString("id-ID")}
                    </p>
                 </div>
                 <div className="flex-1 bg-slate-800/50 px-5 py-4 rounded-2xl border border-slate-700/50">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Tabungan</p>
                    <p className={`font-bold text-sm ${totalSavings < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                        Rp {totalSavings.toLocaleString("id-ID")}
                    </p>
                 </div>
              </div>
           </div>
        </GlassCard>

        {/* Total Pemasukan - BLUE */}
        <Link href="/dashboard/income" className="block">
            <GlassCard className="h-full p-8 bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 shadow-sm relative group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Pemasukan</p>
            <h3 className="text-2xl font-black text-blue-600">Rp {totalIncome.toLocaleString("id-ID")}</h3>
            </GlassCard>
        </Link>

        {/* Total Pengeluaran - ORANGE */}
        <Link href="/dashboard/expenses" className="block">
            <GlassCard className="h-full p-8 bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 shadow-sm relative group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Pengeluaran</p>
            <h3 className="text-2xl font-black text-orange-600">Rp {totalExpenseMain.toLocaleString("id-ID")}</h3>
            </GlassCard>
        </Link>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Tabungan - GOLD */}
        <Link href="/dashboard/savings" className="lg:col-span-2">
            <GlassCard className={`h-full p-8 border-none shadow-xl transition-all cursor-pointer relative overflow-hidden group ${
                totalSavings < 0 
                ? 'bg-gradient-to-br from-rose-600 to-rose-800 shadow-rose-500/20' 
                : 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/20'
            } hover:scale-[1.01]`}>
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <Trophy className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${totalSavings < 0 ? 'text-rose-100' : 'text-amber-100'}`}>
                        {totalSavings < 0 ? 'Defisit Tabungan' : 'Dana Tabungan Terkumpul'}
                    </p>
                    <h3 className={`text-4xl font-black ${totalSavings < 0 ? 'text-white' : 'text-white'}`}>
                        Rp {totalSavings.toLocaleString("id-ID")}
                    </h3>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-black bg-white/20 w-fit px-4 py-2 rounded-xl backdrop-blur-md">
                        {totalSavings < 0 ? 'Periksa Pengeluaran Tabungan' : 'Lihat Progres Goals'} <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
            </GlassCard>
        </Link>

        {/* Financial Health - GREEN */}
        <GlassCard className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-xl shadow-emerald-500/20 group hover:scale-[1.02] transition-all duration-300">
            <div className="p-3 bg-white/20 rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-black text-xl mb-2 tracking-tight">Kesehatan Keuangan</h3>
            <p className="text-emerald-50/80 text-xs leading-relaxed font-medium mb-6">
                Porsi ideal tabungan adalah 20% dari total pemasukan Anda. Terus pantau progress goals Anda.
            </p>
            <Link href="/dashboard/expenses" className="inline-block bg-white/20 hover:bg-white/30 transition-all text-white text-[10px] font-black px-5 py-3 rounded-xl backdrop-blur-md uppercase tracking-widest active:scale-95">
                Catat Transaksi
            </Link>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Log Aktivitas Keuangan */}
        <GlassCard className="p-0 overflow-hidden flex flex-col shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
            <div>
                <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                    <List className="w-6 h-6 text-orange-500" />
                    Log Aktivitas Keuangan
                </h3>
            </div>
          </div>
          <div className="flex-1">
            <ActivityLogClient activities={combinedActivities} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
