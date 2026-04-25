"use server";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function addTransaction(data: {
  amount: number;
  description?: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'SAVING' | 'WITHDRAWAL' | 'ALLOCATION';
  categoryId?: string;
  accountId?: string;
  destinationAccountId?: string;
  goalId?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.insert(transactions).values({
      id: crypto.randomUUID(),
      amount: data.amount.toString(),
      description: data.description || null,
      date: new Date(data.date),
      userId: session.user.id,
      type: data.type,
      categoryId: data.categoryId || null,
      accountId: data.accountId || null,
      destinationAccountId: data.destinationAccountId || null,
      goalId: data.goalId || null,
      createdAt: new Date(),
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/income");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/savings");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to add transaction:", error);
    return { error: error.message || "Failed to add transaction" };
  }
}

export async function deleteTransaction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.delete(transactions).where(
      and(
        eq(transactions.id, id),
        eq(transactions.userId, session.user.id)
      )
    );
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/income");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/savings");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return { error: "Failed to delete transaction" };
  }
}

export async function updateTransaction(id: string, data: {
  amount: number;
  description?: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'SAVING' | 'WITHDRAWAL' | 'ALLOCATION';
  categoryId?: string;
  accountId?: string;
  destinationAccountId?: string;
  goalId?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.update(transactions)
      .set({
        amount: data.amount.toString(),
        description: data.description || null,
        date: new Date(data.date),
        type: data.type,
        categoryId: data.categoryId || null,
        accountId: data.accountId || null,
        destinationAccountId: data.destinationAccountId || null,
        goalId: data.goalId || null,
      })
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, session.user.id)
        )
      );
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/income");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/savings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { error: "Failed to update transaction" };
  }
}
