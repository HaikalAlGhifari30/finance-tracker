"use server";

import { db } from "@/db";
import { goldAssets, members } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";

export async function getGoldAssets(filterMemberId?: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return [];

  try {
    const conditions = [eq(goldAssets.userId, session.user.id)];
    if (filterMemberId && filterMemberId !== "all") {
      conditions.push(eq(goldAssets.memberId, filterMemberId));
    }

    const items = await db
      .select({
        id: goldAssets.id,
        userId: goldAssets.userId,
        memberId: goldAssets.memberId,
        memberName: members.name,
        type: goldAssets.type,
        brand: goldAssets.brand,
        productName: goldAssets.productName,
        jewelryType: goldAssets.jewelryType,
        purity: goldAssets.purity,
        weight: goldAssets.weight,
        purchasePrice: goldAssets.purchasePrice,
        purchaseDate: goldAssets.purchaseDate,
        status: goldAssets.status,
        salePrice: goldAssets.salePrice,
        saleDate: goldAssets.saleDate,
        note: goldAssets.note,
        createdAt: goldAssets.createdAt,
        updatedAt: goldAssets.updatedAt,
      })
      .from(goldAssets)
      .leftJoin(members, eq(goldAssets.memberId, members.id))
      .where(and(...conditions))
      .orderBy(desc(goldAssets.createdAt))
      .execute();

    return items.map(item => ({
      ...item,
      weight: Number(item.weight),
      purchasePrice: Number(item.purchasePrice),
      salePrice: item.salePrice ? Number(item.salePrice) : null,
      purchaseDate: item.purchaseDate ? item.purchaseDate.toISOString() : new Date().toISOString(),
      saleDate: item.saleDate ? item.saleDate.toISOString() : null,
    }));
  } catch (error) {
    console.error("Failed to get gold assets:", error);
    return [];
  }
}

export async function createGoldAsset(data: {
  memberId: string;
  type: string; // LOGAM_MULIA | PERHIASAN
  brand?: string;
  productName?: string;
  jewelryType?: string;
  purity?: string;
  weight: number;
  purchasePrice: number;
  purchaseDate: string;
  note?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    const now = new Date();
    await db.insert(goldAssets).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      memberId: data.memberId,
      type: data.type,
      brand: data.brand || null,
      productName: data.productName || null,
      jewelryType: data.jewelryType || null,
      purity: data.purity || null,
      weight: data.weight.toString(),
      purchasePrice: data.purchasePrice.toString(),
      purchaseDate: new Date(data.purchaseDate),
      status: "OWNED",
      salePrice: null,
      saleDate: null,
      note: data.note || null,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/dashboard/gold");
    return { success: true };
  } catch (error) {
    console.error("Failed to create gold asset:", error);
    return { error: "Gagal menambahkan aset emas" };
  }
}

export async function updateGoldAsset(
  id: string,
  data: {
    memberId: string;
    type: string;
    brand?: string;
    productName?: string;
    jewelryType?: string;
    purity?: string;
    weight: number;
    purchasePrice: number;
    purchaseDate: string;
    note?: string;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db
      .update(goldAssets)
      .set({
        memberId: data.memberId,
        type: data.type,
        brand: data.brand || null,
        productName: data.productName || null,
        jewelryType: data.jewelryType || null,
        purity: data.purity || null,
        weight: data.weight.toString(),
        purchasePrice: data.purchasePrice.toString(),
        purchaseDate: new Date(data.purchaseDate),
        note: data.note || null,
        updatedAt: new Date(),
      })
      .where(and(eq(goldAssets.id, id), eq(goldAssets.userId, session.user.id)));

    revalidatePath("/dashboard/gold");
    return { success: true };
  } catch (error) {
    console.error("Failed to update gold asset:", error);
    return { error: "Gagal memperbarui aset emas" };
  }
}

export async function sellGoldAsset(
  id: string,
  data: {
    salePrice: number;
    saleDate: string;
    note?: string;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db
      .update(goldAssets)
      .set({
        status: "SOLD",
        salePrice: data.salePrice.toString(),
        saleDate: new Date(data.saleDate),
        note: data.note || null,
        updatedAt: new Date(),
      })
      .where(and(eq(goldAssets.id, id), eq(goldAssets.userId, session.user.id)));

    revalidatePath("/dashboard/gold");
    return { success: true };
  } catch (error) {
    console.error("Failed to sell gold asset:", error);
    return { error: "Gagal mencatat penjualan emas" };
  }
}

export async function deleteGoldAsset(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db
      .delete(goldAssets)
      .where(and(eq(goldAssets.id, id), eq(goldAssets.userId, session.user.id)));

    revalidatePath("/dashboard/gold");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete gold asset:", error);
    return { error: "Gagal menghapus aset emas" };
  }
}
