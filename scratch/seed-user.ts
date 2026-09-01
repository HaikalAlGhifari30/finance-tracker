import 'dotenv/config';
import { db } from "../src/db";
import { user, account } from "../src/db/schema";
import { hashPassword } from "better-auth/crypto";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";

async function run() {
  const email = "bokal@gmail.com";
  const password = "bokaltesting123";
  const name = "Bokal";

  console.log("Seeding user into new database Fintrack_v2...");
  const now = new Date();
  const userId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);
  const hashed = await hashPassword(password);

  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);

  if (existing.length === 0) {
    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      role: "SUPERADMIN",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(account).values({
      id: crypto.randomUUID().replace(/-/g, "").substring(0, 32),
      userId: userId,
      accountId: email,
      providerId: "email-password",
      password: hashed,
      createdAt: now,
      updatedAt: now,
    });
    console.log("SUCCESS! User bokal@gmail.com created on new DB!");
  } else {
    console.log("User already exists on new DB!");
  }
}

run().catch(console.error);
