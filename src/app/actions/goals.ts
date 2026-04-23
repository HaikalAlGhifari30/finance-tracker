"use server";

import { db } from "@/db";
import { goals } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";

export async function addGoal(name: string, targetAmount: number) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    // Check for duplicate name
    const existing = await db.select().from(goals).where(
      and(
        eq(goals.userId, session.user.id),
        sql`lower(${goals.name}) = lower(${name})`
      )
    ).execute();

    if (existing.length > 0) {
      return { error: "Tujuan (goal) sudah ada" };
    }

    await db.insert(goals).values({
      id: crypto.randomUUID(),
      name,
      targetAmount: targetAmount.toString(),
      userId: session.user.id,
      createdAt: new Date()
    });
    
    revalidatePath("/dashboard/savings");
    revalidatePath("/dashboard/expenses");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to add goal" };
  }
}

export async function deleteGoal(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.delete(goals).where(
      and(
        eq(goals.id, id),
        eq(goals.userId, session.user.id)
      )
    );
    
    revalidatePath("/dashboard/savings");
    revalidatePath("/dashboard/expenses");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete goal" };
  }
}
