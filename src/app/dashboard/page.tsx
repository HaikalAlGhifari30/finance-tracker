import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/db";
import { transactions, categories, goals, accounts as accountsTable, members as membersTable } from "@/db/schema";
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
import { getAccounts } from "@/app/actions/accounts";
import { getMembers } from "@/app/actions/members";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/");

  const userId = session.user.id;

  const [members, accounts, allUserTransactions, recentActivities, [goalData]] = await Promise.all([
    getMembers(),
    getAccounts(),
    db.select().from(transactions).where(eq(transactions.userId, userId)).execute(),
    db.select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      type: transactions.type,
      categoryName: categories.name,
      accountName: sql<string>`COALESCE(${accountsTable.name}, '(Dihapus)')`,
      memberName: membersTable.name,
      memberId: sql<string>`COALESCE(${transactions.memberId}, ${accountsTable.memberId})`,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accountsTable, eq(transactions.accountId, accountsTable.id))
    .leftJoin(membersTable, eq(transactions.memberId, membersTable.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(500)
    .execute(),
    db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.isMain, true))).limit(1).execute()
  ]);

  const liquidAssets = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // 2. Calculate Total Savings Pool (SAVING - WITHDRAWAL)
  const totalSavingsPool = allUserTransactions.reduce((sum, t) => {
    const amount = Number(t.amount);
    if (t.type === 'SAVING') return sum + amount;
    if (t.type === 'WITHDRAWAL') return sum - amount;
    return sum;
  }, 0);

  const totalAssets = liquidAssets + totalSavingsPool;

  let mainGoal = null;
  if (goalData) {
    const goalBalance = allUserTransactions
      .filter(t => t.goalId === goalData.id || t.destinationGoalId === goalData.id)
      .reduce((sum, t) => {
        const amount = Number(t.amount);
        
        if (t.destinationGoalId === goalData.id) return sum + amount;
        
        if (t.goalId === goalData.id) {
          if (t.type === 'SAVING' || t.type === 'TRANSFER') return sum + amount;
          if (t.type === 'WITHDRAWAL') return sum - amount;
          if (t.type === 'EXPENSE' && !t.accountId) return sum - amount;
          if (t.type === 'ALLOCATION') {
            if (t.destinationGoalId) return sum - amount;
            return sum + amount; 
          }
        }
        return sum;
      }, 0);

    mainGoal = {
      ...goalData,
      balance: goalBalance
    };
  }

  return (
    <DashboardClientPage 
      initialActivities={recentActivities} 
      user={session.user} 
      totalAssets={totalAssets}
      totalSavingsPool={totalSavingsPool}
      mainGoal={mainGoal}
      accounts={accounts}
      members={members}
    />
  );
}
