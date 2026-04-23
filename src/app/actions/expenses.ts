"use server";

import { db } from "@/db";
import { expenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function addExpense(amount: number, categoryId: string, description: string, date: string, source: string = "MAIN", goalId?: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.insert(expenses).values({
      id: crypto.randomUUID(),
      amount: amount.toString(),
      categoryId,
      description,
      date: new Date(date),
      userId: session.user.id,
      source,
      goalId: goalId || null
    });
    
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/savings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to record expense" };
  }
}

export async function updateExpense(id: string, amount: number, categoryId: string, description: string, date: string, source: string = "MAIN", goalId?: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.update(expenses)
      .set({
        amount: amount.toString(),
        categoryId,
        description,
        date: new Date(date),
        source,
        goalId: goalId || null
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.userId, session.user.id)
        )
      );
    
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/savings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update expense" };
  }
}

export async function deleteExpense(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.delete(expenses).where(
      and(
        eq(expenses.id, id),
        eq(expenses.userId, session.user.id)
      )
    );
    
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/savings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete expense" };
  }
}
