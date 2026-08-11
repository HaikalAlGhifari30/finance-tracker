"use server";

import { db } from "@/db";
import { budgetPeriods, budgetItems, categories, transactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function getBudgetPeriod(month: string, year: string, memberId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.id;

  const [period] = await db
    .select()
    .from(budgetPeriods)
    .where(
      and(
        eq(budgetPeriods.userId, userId),
        eq(budgetPeriods.month, month),
        eq(budgetPeriods.year, year),
        memberId ? eq(budgetPeriods.memberId, memberId) : sql`${budgetPeriods.memberId} IS NULL`
      )
    )
    .limit(1)
    .execute();

  if (!period) return null;

  const items = await db
    .select({
      id: budgetItems.id,
      categoryId: budgetItems.categoryId,
      categoryName: categories.name,
      amount: budgetItems.amount,
    })
    .from(budgetItems)
    .innerJoin(categories, eq(budgetItems.categoryId, categories.id))
    .where(eq(budgetItems.periodId, period.id))
    .execute();

  return {
    ...period,
    totalBudget: Number(period.totalBudget),
    items: items.map(item => ({
      ...item,
      amount: Number(item.amount)
    }))
  };
}

export async function createBudgetPeriod(month: string, year: string, copyFromPrevious: boolean = false, memberId?: string, initialTotalBudget: number = 0) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.id;

  const periodId = uuidv4();
  
  let prevTotalBudget = initialTotalBudget.toString();
  let prevItems: any[] = [];

  if (copyFromPrevious) {
    // Logic to find previous month
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const [prevPeriod] = await db
      .select()
      .from(budgetPeriods)
      .where(
        and(
          eq(budgetPeriods.userId, userId),
          eq(budgetPeriods.month, prevMonth.toString()),
          eq(budgetPeriods.year, prevYear.toString())
        )
      )
      .orderBy(sql`CASE WHEN ${budgetPeriods.memberId} = ${memberId || ''} THEN 1 WHEN ${budgetPeriods.memberId} IS NULL THEN 2 ELSE 3 END`)
      .limit(1)
      .execute();

    if (prevPeriod) {
      prevTotalBudget = prevPeriod.totalBudget;
      prevItems = await db
        .select()
        .from(budgetItems)
        .where(eq(budgetItems.periodId, prevPeriod.id))
        .execute();
    }
  }

  // Remove any existing empty period for this month/year first to prevent duplication
  await db.delete(budgetPeriods).where(
    and(
      eq(budgetPeriods.userId, userId),
      eq(budgetPeriods.month, month),
      eq(budgetPeriods.year, year),
      memberId ? eq(budgetPeriods.memberId, memberId) : sql`${budgetPeriods.memberId} IS NULL`
    )
  ).execute();

  await db.insert(budgetPeriods).values({
    id: periodId,
    userId,
    month,
    year,
    memberId: memberId || null,
    totalBudget: prevTotalBudget,
    createdAt: new Date(),
  }).execute();

  if (copyFromPrevious && prevItems.length > 0) {
    await db.insert(budgetItems).values(
      prevItems.map(item => ({
        id: uuidv4(),
        periodId,
        categoryId: item.categoryId,
        amount: item.amount,
      }))
    ).execute();
  }

  revalidatePath("/dashboard/budget");
  return periodId;
}

export async function updateBudgetPeriodTotal(periodId: string, totalBudget: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");

  await db.update(budgetPeriods)
    .set({ totalBudget: totalBudget.toString() })
    .where(eq(budgetPeriods.id, periodId))
    .execute();

  revalidatePath("/dashboard/budget");
}

export async function deleteBudgetPeriod(periodId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");

  await db.delete(budgetItems).where(eq(budgetItems.periodId, periodId)).execute();
  await db.delete(budgetPeriods).where(eq(budgetPeriods.id, periodId)).execute();

  revalidatePath("/dashboard/budget");
}

export async function upsertBudgetItems(periodId: string, items: { categoryId: string; amount: number }[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");

  // Simple approach: delete existing and insert new
  await db.delete(budgetItems).where(eq(budgetItems.periodId, periodId)).execute();

  if (items.length > 0) {
    await db.insert(budgetItems).values(
      items.map(item => ({
        id: uuidv4(),
        periodId,
        categoryId: item.categoryId,
        amount: item.amount.toString(),
      }))
    ).execute();
  }

  revalidatePath("/dashboard/budget");
}

export async function getCategoryExpensesForPeriod(month: string, year: string, memberId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.id;

  // We need to calculate total expenses per category for this month/year
  // Using transactions table
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

  const expenses = await db
    .select({
      categoryId: transactions.categoryId,
      totalAmount: sql<string>`sum(${transactions.amount})`.as("totalAmount"),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "EXPENSE"),
        sql`${transactions.date} >= ${startDate} AND ${transactions.date} <= ${endDate}`,
        memberId ? eq(transactions.memberId, memberId) : undefined
      )
    )
    .groupBy(transactions.categoryId)
    .execute();

  return expenses.reduce((acc, curr) => {
    if (curr.categoryId) {
      acc[curr.categoryId] = Number(curr.totalAmount);
    }
    return acc;
  }, {} as Record<string, number>);
}

export async function getBudgetPeriodSavings(month: string, year: string, memberId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.id;

  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

  // Only count savings that were explicitly taken from budget (marked with [DARI_BUDGET] prefix)
  const savings = await db
    .select({
      type: transactions.type,
      totalAmount: sql<string>`sum(${transactions.amount})`.as("totalAmount"),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        sql`${transactions.type} IN ('SAVING', 'WITHDRAWAL')`,
        sql`${transactions.date} >= ${startDate} AND ${transactions.date} <= ${endDate}`,
        sql`${transactions.description} LIKE '[DARI_BUDGET]%'`,
        memberId ? eq(transactions.memberId, memberId) : undefined
      )
    )
    .groupBy(transactions.type)
    .execute();

  let totalSavings = 0;
  let totalWithdrawals = 0;

  savings.forEach(item => {
    if (item.type === 'SAVING') totalSavings = Number(item.totalAmount);
    if (item.type === 'WITHDRAWAL') totalWithdrawals = Number(item.totalAmount);
  });

  return { totalSavings, totalWithdrawals };
}
