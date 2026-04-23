"use server";

import { db } from "@/db";
import { income } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function addIncome(amount: number, categoryId: string | null, description: string, dateStr: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.insert(income).values({
      id: crypto.randomUUID(),
      amount: amount.toString(),
      categoryId: categoryId || null,
      userId: session.user.id,
      description: description || null,
      date: new Date(dateStr)
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/income");
    return { success: true };
  } catch (error) {
    console.error("Failed to add income:", error);
    return { error: "Failed to add income" };
  }
}

export async function deleteIncome(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.delete(income).where(
      and(
        eq(income.id, id),
        eq(income.userId, session.user.id)
      )
    );
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/income");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete income:", error);
    return { error: "Failed to delete income" };
  }
}

export async function updateIncome(id: string, amount: number, categoryId: string | null, description: string, dateStr: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.update(income)
      .set({
        amount: amount.toString(),
        categoryId: categoryId || null,
        description: description || null,
        date: new Date(dateStr)
      })
      .where(
        and(
          eq(income.id, id),
          eq(income.userId, session.user.id)
        )
      );
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/income");
    return { success: true };
  } catch (error) {
    console.error("Failed to update income:", error);
    return { error: "Failed to update income" };
  }
}
