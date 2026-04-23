import { db } from "@/db";
import { expenses, categories, goals } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SavingsClientPage from "./SavingsClientPage";

export default async function SavingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // 1. Fetch Goals
  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .execute();

  // 2. Calculate Total Savings Pool
  // Concept: Inflow to savings is any expense categorized as 'Tabungan' from MAIN source
  // Outflow from savings is any expense with source 'SAVINGS'
  
  // Get category ID for 'Tabungan'
  const tabunganCat = await db.select().from(categories).where(
    and(
        eq(categories.userId, userId),
        sql`lower(${categories.name}) = 'tabungan'`
    )
  ).execute();

  const tabunganCatId = tabunganCat[0]?.id;

  // Sum inflows (Expenses categorized as Tabungan)
  const inflowRes = tabunganCatId ? await db.select({
    total: sql<number>`sum(${expenses.amount})`
  }).from(expenses).where(
    and(
        eq(expenses.userId, userId),
        eq(expenses.categoryId, tabunganCatId),
        eq(expenses.source, 'MAIN')
    )
  ).execute() : [{ total: 0 }];

  // Sum outflows (Expenses with source SAVINGS)
  const outflowRes = await db.select({
    total: sql<number>`sum(${expenses.amount})`
  }).from(expenses).where(
    and(
        eq(expenses.userId, userId),
        eq(expenses.source, 'SAVINGS')
    )
  ).execute();

  const totalInflow = Number(inflowRes[0]?.total || 0);
  const totalOutflow = Number(outflowRes[0]?.total || 0);
  const totalSavingsPool = totalInflow - totalOutflow;

  // 3. Fetch Savings Transaction History (Inflows)
  const history = tabunganCatId ? await db.select({
    id: expenses.id,
    amount: expenses.amount,
    description: expenses.description,
    date: expenses.date,
    goalId: expenses.goalId,
    goalName: goals.name
  })
  .from(expenses)
  .leftJoin(goals, eq(expenses.goalId, goals.id))
  .where(
    and(
        eq(expenses.userId, userId),
        eq(expenses.categoryId, tabunganCatId)
    )
  )
  .orderBy(sql`${expenses.date} desc`)
  .execute() : [];

  return (
    <SavingsClientPage 
      totalSavingsPool={totalSavingsPool}
      goals={userGoals}
      history={history}
    />
  );
}
