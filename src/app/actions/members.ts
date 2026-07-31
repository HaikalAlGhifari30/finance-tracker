"use server";

import { db } from "@/db";
import { members } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, asc, desc, sql } from "drizzle-orm";

export async function getMembers() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return [];

  try {
    const data = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.isActive, true)
        )
      )
      .orderBy(desc(members.isOwner), asc(members.createdAt))
      .execute();

    // Pastikan selalu ada member owner
    const hasOwner = data.some(m => m.isOwner);
    if (!hasOwner) {
      const ownerName = session.user.name || "Pemilik Akun";
      const newOwner = {
        id: crypto.randomUUID(),
        userId: session.user.id,
        name: ownerName,
        isOwner: true,
        isActive: true,
        createdAt: new Date(),
      };
      
      await db.insert(members).values(newOwner);

      // Migrasi data lama yang belum punya memberId agar menjadi milik owner
      const { transactions, accounts, budgetPeriods } = await import("@/db/schema");
      
      await db.update(transactions)
        .set({ memberId: newOwner.id })
        .where(and(eq(transactions.userId, session.user.id), sql`${transactions.memberId} IS NULL`));
        
      await db.update(accounts)
        .set({ memberId: newOwner.id })
        .where(and(eq(accounts.userId, session.user.id), sql`${accounts.memberId} IS NULL`));
        
      await db.update(budgetPeriods)
        .set({ memberId: newOwner.id })
        .where(and(eq(budgetPeriods.userId, session.user.id), sql`${budgetPeriods.memberId} IS NULL`));

      return [newOwner, ...data];
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return [];
  }
}

export async function addMember(name: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.insert(members).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      isOwner: false,
      createdAt: new Date(),
    });
    
    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to add member:", error);
    return { error: "Gagal menambah anggota" };
  }
}

export async function updateMember(id: string, name: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.update(members)
      .set({ name })
      .where(
        and(
          eq(members.id, id),
          eq(members.userId, session.user.id)
        )
      );
    
    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update member:", error);
    return { error: "Gagal mengubah anggota" };
  }
}

export async function deactivateMember(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    const [member] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.id, id),
          eq(members.userId, session.user.id)
        )
      )
      .limit(1)
      .execute();

    if (!member) return { error: "Anggota tidak ditemukan" };
    if (member.isOwner) return { error: "Pemilik akun tidak dapat dihapus" };

    await db.update(members)
      .set({ isActive: false })
      .where(
        and(
          eq(members.id, id),
          eq(members.userId, session.user.id)
        )
      );
    
    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to deactivate member:", error);
    return { error: "Gagal menghapus anggota" };
  }
}
