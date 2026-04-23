"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getSetting(key: string) {
  try {
    const result = await db.select().from(settings).where(eq(settings.key, key)).execute();
    return { success: true, value: result[0]?.value || null };
  } catch (error: any) {
    console.error("Error getting setting:", error);
    return { success: false, error: "Failed to load settings" };
  }
}

export async function updateSetting(key: string, value: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Cast user to any to bypass the missing 'role' property type error during build
    const user = session?.user as any;
    if (!session || user?.role !== "SUPERADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // Upsert equivalent since we have key as primary
    const existing = await db.select().from(settings).where(eq(settings.key, key)).execute();
    
    if (existing.length > 0) {
      await db.update(settings).set({ value }).where(eq(settings.key, key)).execute();
    } else {
      await db.insert(settings).values({ key, value }).execute();
    }

    revalidatePath("/admin/settings");
    revalidatePath("/forgot-password");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating setting:", error);
    return { success: false, error: "Gagal menyimpan data" };
  }
}
