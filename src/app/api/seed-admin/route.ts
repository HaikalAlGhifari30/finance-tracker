export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, account } from "@/db/schema";
import { hashPassword } from "better-auth/crypto";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";

export async function GET() {
  const email = "admin@gmail.com";
  const password = "adminpassword";
  const name = "Super Admin";

  try {
    // 1. Check if user exists
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
    
    const now = new Date();
    const userId = existing.length > 0 ? existing[0].id : crypto.randomUUID().replace(/-/g, "").substring(0, 32);
    const hashed = await hashPassword(password);

    if (existing.length === 0) {
      // Create user
      await db.insert(user).values({
        id: userId,
        name,
        email,
        emailVerified: true,
        role: "SUPERADMIN",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Update role
      await db.update(user).set({ role: "SUPERADMIN", updatedAt: now }).where(eq(user.id, userId));
    }

    // 2. Handle account (delete first to ensure fresh hash and correct providerId)
    await db.delete(account).where(eq(account.userId, userId));
    
    await db.insert(account).values({
      id: crypto.randomUUID().replace(/-/g, "").substring(0, 32),
      userId: userId,
      accountId: userId,
      providerId: "credential",
      password: hashed,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ 
      success: true, 
      message: "SuperAdmin seeded/updated successfully!",
      credentials: { email, password }
    });
  } catch (error: any) {
    console.error("Seed Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
