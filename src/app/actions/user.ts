"use server";

import crypto from "node:crypto";
import { db } from "@/db";
import { user, account } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hashPassword } from "better-auth/crypto";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "SUPERADMIN" | "USER";
  const npwp = formData.get("npwp") as string;
  const phoneNumber = formData.get("phoneNumber") as string;

  if (!name || !email || !password || !role) {
    return { error: "Semua kolom wajib diisi" };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if ((session?.user as any)?.role !== "SUPERADMIN") return { error: "Tidak memiliki otoritas" };

  try {
    // 1. Check if email already exists
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);

    if (existing.length > 0) {
      return { error: "Alamat email sudah terdaftar" };
    }

    const now = new Date();
    const userId = crypto.randomUUID().replace(/-/g, "").substring(0, 32); // Match better-auth format or similar
    const accountId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);
    const hashed = await hashPassword(password);

    await db.transaction(async (tx) => {
      // 2. Insert into user table
      await tx.insert(user).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        role,
        npwp: npwp || null,
        phoneNumber: phoneNumber || null,
        createdAt: now,
        updatedAt: now,
      });

      // 3. Insert into account table (for credentials)
      await tx.insert(account).values({
        id: accountId,
        userId: userId,
        accountId: email,
        providerId: "email-password",
        password: hashed,
        createdAt: now,
        updatedAt: now,
      });
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e: any) {
    console.error("Manual User Creation Failure:", e);
    return { error: "Gagal membuat pengguna secara teknis." };
  }
}

export async function deleteUser(id: string) {
  if (!id) return { error: "ID tidak valid" };

  const session = await auth.api.getSession({ headers: await headers() });
  if ((session?.user as any)?.role !== "SUPERADMIN") return { error: "Tidak memiliki otoritas" };

  // Prevent deleting self
  if (session?.user?.id === id) return { error: "Anda tidak bisa menghapus akun Anda sendiri." };

  try {
    await db.delete(user).where(eq(user.id, id));
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e: any) {
    return { error: "Gagal menghapus pengguna." };
  }
}

export async function updateUser(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as "SUPERADMIN" | "USER";
  const npwp = formData.get("npwp") as string;
  const phoneNumber = formData.get("phoneNumber") as string;

  if (!id || !name || !email || !role) return { error: "Semua kolom wajib diisi" };

  const session = await auth.api.getSession({ headers: await headers() });
  if ((session?.user as any)?.role !== "SUPERADMIN") return { error: "Tidak memiliki otoritas" };

  try {
    await db
      .update(user)
      .set({ name, email, role, npwp, phoneNumber, updatedAt: new Date() })
      .where(eq(user.id, id));
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Gagal memperbarui data pengguna." };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  if (!userId || !newPassword) return { error: "Data tidak lengkap" };
  if (newPassword.length < 6) return { error: "Password minimal 6 karakter" };

  const session = await auth.api.getSession({ headers: await headers() });
  if ((session?.user as any)?.role !== "SUPERADMIN") return { error: "Tidak memiliki otoritas" };

  try {
    const hashed = await hashPassword(newPassword);

    await db
      .update(account)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(account.userId, userId));

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Gagal mereset password" };
  }
}
