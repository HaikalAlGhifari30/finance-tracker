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
    items: items.map(item => ({
      ...item,
      amount: Number(item.amount)
    }))
  };
}

export async function createBudgetPeriod(month: string, year: string, copyFromPrevious: boolean = false, memberId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.id;

  const periodId = uuidv4();
  await db.insert(budgetPeriods).values({
    id: periodId,
    userId,
    month,
    year,
    memberId: memberId || null,
    createdAt: new Date(),
  }).execute();

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
          eq(budgetPeriods.year, prevYear.toString()),
          memberId ? eq(budgetPeriods.memberId, memberId) : sql`${budgetPeriods.memberId} IS NULL`
        )
      )
      .limit(1)
      .execute();

    if (prevPeriod) {
      const prevItems = await db
        .select()
        .from(budgetItems)
        .where(eq(budgetItems.periodId, prevPeriod.id))
        .execute();

      if (prevItems.length > 0) {
        await db.insert(budgetItems).values(
          prevItems.map(item => ({
            id: uuidv4(),
            periodId,
            categoryId: item.categoryId,
            amount: item.amount,
          }))
        ).execute();
      }
    }
  }

  revalidatePath("/dashboard/budget");
  return periodId;
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
