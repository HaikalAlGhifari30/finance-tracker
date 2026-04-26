"use server";

import { db } from "@/db";
import { goals, transactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

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

export async function updateGoal(id: string, name: string, targetAmount: number) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.update(goals)
      .set({
        name,
        targetAmount: targetAmount.toString()
      })
      .where(
        and(
          eq(goals.id, id),
          eq(goals.userId, session.user.id)
        )
      );
    
    revalidatePath("/dashboard/savings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to update goal" };
  }
}

export async function setMainGoal(id: string | null) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    // 1. Reset all main goals for this user
    await db.update(goals)
      .set({ isMain: false })
      .where(eq(goals.userId, session.user.id));

    // 2. If an id is provided, set it as main
    if (id) {
      await db.update(goals)
        .set({ isMain: true })
        .where(
          and(
            eq(goals.id, id),
            eq(goals.userId, session.user.id)
          )
        );
    }
    
    revalidatePath("/dashboard/savings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to set main goal" };
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
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to delete goal" };
  }
}
export async function allocateSavings(amount: number, toGoalId: string, fromGoalId?: string, description?: string, dateStr?: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  const date = dateStr ? new Date(dateStr) : new Date();
  
  try {
    const userId = session.user.id;

    let sourceGoalName = "Tabungan Umum";
    let targetGoalName = "Tabungan Umum";

    // 1. Validate Target Goal
    if (toGoalId) {
      const targetGoal = await db.select()
        .from(goals)
        .where(and(eq(goals.id, toGoalId), eq(goals.userId, userId)))
        .limit(1).execute();

      if (targetGoal.length === 0) return { error: "Goal tujuan tidak ditemukan." };
      targetGoalName = targetGoal[0].name;
    }

    // 2. Validate Source Goal (if any)
    if (fromGoalId) {
      const sourceGoal = await db.select()
        .from(goals)
        .where(and(eq(goals.id, fromGoalId), eq(goals.userId, userId)))
        .limit(1).execute();
      
      if (sourceGoal.length === 0) return { error: "Goal asal tidak ditemukan." };
      sourceGoalName = sourceGoal[0].name;
    }

    // 3. Create the transaction
    await db.insert(transactions).values({
      id: crypto.randomUUID(),
      amount: amount.toString(),
      description: description || `Alokasi dana dari ${sourceGoalName} ke ${targetGoalName}`,
      date: date,
      userId: userId,
      type: 'ALLOCATION',
      goalId: fromGoalId || null, // Source
      destinationGoalId: toGoalId || null, // Destination
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/savings");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Allocation Error:", error);
    return { error: error instanceof Error ? error.message : "Gagal mengalokasikan dana." };
  }
}
