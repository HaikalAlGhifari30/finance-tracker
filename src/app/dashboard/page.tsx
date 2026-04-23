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
import DashboardClientPage from "./DashboardClientPage";

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
    <DashboardClientPage 
      initialActivities={combinedActivities} 
      user={session.user} 
    />
  );
}
