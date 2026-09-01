"use server";

import crypto from "node:crypto";
import { db } from "@/db";
import { user, account, members } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hashPassword } from "better-auth/crypto";

function checkIsSuperAdmin(session: any) {
  if (!session?.user) return false;
  return session.user.role === "SUPERADMIN" || session.user.email === "bokal@gmail.com";
}

export async function getUsers() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!checkIsSuperAdmin(session)) {
    return { error: "Akses ditolak" };
  }

  try {
    const allUsers = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }).from(user).orderBy(desc(user.createdAt));

    // Sort to put SUPERADMIN / Bokal at the top
    allUsers.sort((a, b) => {
      const isSuperA = a.role === "SUPERADMIN" || a.email === "bokal@gmail.com";
      const isSuperB = b.role === "SUPERADMIN" || b.email === "bokal@gmail.com";
      if (isSuperA && !isSuperB) return -1;
      if (!isSuperA && isSuperB) return 1;
      return 0;
    });

    return { success: true, data: allUsers };
  } catch (e: any) {
    console.error("Get Users Error:", e);
    return { error: e.message || "Gagal mengambil data pengguna." };
  }
}

export async function createUser(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!checkIsSuperAdmin(session)) {
    return { error: "Tidak memiliki otoritas" };
  }

  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const role = (formData.get("role") as string) || "USER";

  if (!name || !email || !password) {
    return { error: "Nama, email, dan password wajib diisi" };
  }

  if (confirmPassword && password !== confirmPassword) {
    return { error: "Konfirmasi password tidak cocok" };
  }

  if (password.length < 8) {
    return { error: "Password minimal 8 karakter" };
  }

  try {
    // 1. Check if email already exists
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existing.length > 0) {
      return { error: "Alamat email sudah terdaftar" };
    }

    const now = new Date();
    const userId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);
    const accountId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);
    const hashed = await hashPassword(password);

    // Force default to USER unless specified
    const userRole = role === "SUPERADMIN" ? "SUPERADMIN" : "USER";

    // Insert into user table
    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      role: userRole,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Insert into account table for credential login
    await db.insert(account).values({
      id: accountId,
      userId: userId,
      accountId: userId,
      providerId: "credential",
      password: hashed,
      createdAt: now,
      updatedAt: now,
    });

    // Create a member entry for financial multi-member consistency
    const memberId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);
    await db.insert(members).values({
      id: memberId,
      userId: userId,
      name: name,
      isOwner: true,
      isActive: true,
      createdAt: now,
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e: any) {
    console.error("Create User Error:", e);
    return { error: e.message || "Gagal membuat pengguna." };
  }
}

export async function updateUser(id: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!checkIsSuperAdmin(session)) {
    return { error: "Tidak memiliki otoritas" };
  }

  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const isActive = formData.get("isActive") === "true";

  if (!id || !name || !email) {
    return { error: "Nama dan email wajib diisi" };
  }

  try {
    const existing = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (existing.length === 0) return { error: "Pengguna tidak ditemukan" };

    // Prevent deactivating Super Admin Bokal
    if ((existing[0].role === "SUPERADMIN" || existing[0].email === "bokal@gmail.com") && !isActive) {
      return { error: "Akun Super Admin tidak boleh dinonaktifkan." };
    }

    await db
      .update(user)
      .set({
        name,
        email,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(user.id, id));

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e: any) {
    console.error("Update User Error:", e);
    return { error: e.message || "Gagal memperbarui data pengguna." };
  }
}

export async function toggleUserStatus(id: string, currentStatus: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!checkIsSuperAdmin(session)) {
    return { error: "Tidak memiliki otoritas" };
  }

  if (!id) return { error: "ID tidak valid" };

  try {
    const existing = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (existing.length === 0) return { error: "Pengguna tidak ditemukan" };

    // Prevent deactivating Super Admin Bokal
    if ((existing[0].role === "SUPERADMIN" || existing[0].email === "bokal@gmail.com") && currentStatus) {
      return { error: "Akun Super Admin tidak boleh dinonaktifkan." };
    }

    const nextStatus = !currentStatus;

    await db
      .update(user)
      .set({
        isActive: nextStatus,
        updatedAt: new Date()
      })
      .where(eq(user.id, id));

    revalidatePath("/dashboard/users");
    return { success: true, isActive: nextStatus };
  } catch (e: any) {
    console.error("Toggle User Status Error:", e);
    return { error: e.message || "Gagal mengubah status pengguna." };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!checkIsSuperAdmin(session)) {
    return { error: "Tidak memiliki otoritas" };
  }

  if (!userId || !newPassword) return { error: "Data tidak lengkap" };
  if (newPassword.length < 8) return { error: "Password minimal 8 karakter" };

  try {
    const hashed = await hashPassword(newPassword);

    await db
      .update(account)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(account.userId, userId));

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e: any) {
    console.error("Reset Password Error:", e);
    return { error: e.message || "Gagal mereset password" };
  }
}

export async function deleteUser(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!checkIsSuperAdmin(session)) {
    return { error: "Tidak memiliki otoritas" };
  }

  if (!id) return { error: "ID tidak valid" };

  try {
    const existing = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (existing.length === 0) return { error: "Pengguna tidak ditemukan" };

    if (existing[0].role === "SUPERADMIN" || existing[0].email === "bokal@gmail.com") {
      return { error: "Akun Super Admin tidak boleh dihapus." };
    }

    await db.delete(user).where(eq(user.id, id));
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e: any) {
    console.error("Delete User Error:", e);
    return { error: e.message || "Gagal menghapus pengguna." };
  }
}
