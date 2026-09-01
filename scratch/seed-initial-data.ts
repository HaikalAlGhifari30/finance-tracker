import 'dotenv/config';
import { db } from "../src/db";
import { user, members, accounts, goals, transactions } from "../src/db/schema";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Fetching user bokal@gmail.com...");
  const u = await db.select().from(user).where(eq(user.email, "bokal@gmail.com")).limit(1);
  if (u.length === 0) {
    console.log("User bokal@gmail.com not found!");
    return;
  }
  const userId = u[0].id;
  const now = new Date();

  // 1. Seed Member (Bokal as owner member)
  let memberId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);
  const existingMembers = await db.select().from(members).where(eq(members.userId, userId));
  if (existingMembers.length === 0) {
    await db.insert(members).values({
      id: memberId,
      userId: userId,
      name: "Bokal",
      isOwner: true,
      isActive: true,
      createdAt: now,
    });
    console.log("Member Bokal created!");
  } else {
    memberId = existingMembers[0].id;
  }

  // 2. Seed Accounts
  const existingAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId));
  let bcaId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);
  let mandiriId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);
  let cashId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);

  if (existingAccounts.length === 0) {
    await db.insert(accounts).values([
      {
        id: bcaId,
        name: "Bank BCA",
        type: "BCA",
        accountNumber: "1234567890",
        userId: userId,
        memberId: memberId,
        createdAt: now,
      },
      {
        id: mandiriId,
        name: "Bank Mandiri",
        type: "MANDIRI",
        accountNumber: "0987654321",
        userId: userId,
        memberId: memberId,
        createdAt: now,
      },
      {
        id: cashId,
        name: "Dompet Tunai",
        type: "CASH",
        accountNumber: "-",
        userId: userId,
        memberId: memberId,
        createdAt: now,
      }
    ]);
    console.log("Default Accounts created!");
  } else {
    bcaId = existingAccounts[0].id;
  }

  // 3. Seed Goals
  const existingGoals = await db.select().from(goals).where(eq(goals.userId, userId));
  if (existingGoals.length === 0) {
    await db.insert(goals).values([
      {
        id: crypto.randomUUID().replace(/-/g, "").substring(0, 32),
        name: "Tabungan Utama",
        targetAmount: "50000000.00",
        userId: userId,
        createdAt: now,
        isMain: true,
      },
      {
        id: crypto.randomUUID().replace(/-/g, "").substring(0, 32),
        name: "Dana Darurat",
        targetAmount: "20000000.00",
        userId: userId,
        createdAt: now,
        isMain: false,
      }
    ]);
    console.log("Default Goals created!");
  }

  // 4. Seed Initial Transactions (to give balance)
  const existingTx = await db.select().from(transactions).where(eq(transactions.userId, userId));
  if (existingTx.length === 0) {
    await db.insert(transactions).values([
      {
        id: crypto.randomUUID().replace(/-/g, "").substring(0, 32),
        amount: "15000000.00",
        description: "Gaji Bulan Ini",
        date: now,
        userId: userId,
        memberId: memberId,
        type: "INCOME",
        accountId: bcaId,
        createdAt: now,
      },
      {
        id: crypto.randomUUID().replace(/-/g, "").substring(0, 32),
        amount: "5000000.00",
        description: "Pemasukan Usaha",
        date: now,
        userId: userId,
        memberId: memberId,
        type: "INCOME",
        accountId: mandiriId,
        createdAt: now,
      },
      {
        id: crypto.randomUUID().replace(/-/g, "").substring(0, 32),
        amount: "1500000.00",
        description: "Tarik Tunai Kebiasaan Harian",
        date: now,
        userId: userId,
        memberId: memberId,
        type: "INCOME",
        accountId: cashId,
        createdAt: now,
      }
    ]);
    console.log("Initial Transactions created!");
  }

  console.log("ALL DATA SEEDED SUCCESSFULLY FOR BOKAL!");
}

run().catch(console.error);
