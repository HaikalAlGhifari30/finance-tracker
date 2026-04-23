"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";

export async function addCategory(name: string, type: string = "EXPENSE") {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    // Check for duplicate within the same type (case-insensitive)
    const existing = await db.select().from(categories).where(
      and(
        eq(categories.userId, session.user.id),
        eq(categories.type, type),
        sql`lower(${categories.name}) = lower(${name})`
      )
    ).execute();

    if (existing.length > 0) {
      return { error: "Kategori sudah ada" };
    }

    await db.insert(categories).values({
      id: crypto.randomUUID(),
      name,
      userId: session.user.id,
      type
    });
    
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/income");
    return { success: true };
  } catch (error) {
    return { error: "Failed to add category" };
  }
}

export async function deleteCategory(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.delete(categories).where(
      and(
        eq(categories.id, id),
        eq(categories.userId, session.user.id)
      )
    );
    
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/income");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete category" };
  }
}
