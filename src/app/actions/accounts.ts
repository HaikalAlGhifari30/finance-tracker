"use server";

import { db } from "@/db";
import { accounts, transactions, categories, expenses, income } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql, or, desc } from "drizzle-orm";

export async function addAccount(name: string, type: string, accountNumber?: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      name,
      type,
      accountNumber: accountNumber || null,
      userId: session.user.id,
      createdAt: new Date(),
    });
    
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to add account:", error);
    return { error: "Failed to add account" };
  }
}

export async function updateAccount(id: string, name: string, type: string, accountNumber?: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    await db.update(accounts)
      .set({
        name,
        type,
        accountNumber: accountNumber || null,
      })
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.userId, session.user.id)
        )
      );
    
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update account:", error);
    return { error: "Failed to update account" };
  }
}

export async function deleteAccount(id: string, destinationAccountId?: string, skipTransfer: boolean = false) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { error: "Unauthorized" };

  try {
    // 1. Get the account and its current balance
    const userAccounts = await db.select().from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, session.user.id)))
      .execute();
    
    const accountData = userAccounts[0];
    if (!accountData) return { error: "Rekening tidak ditemukan" };

    // Fetch all transactions for this account to calculate balance
    const accountTransactions = await db.select()
      .from(transactions)
      .where(
        or(
          eq(transactions.accountId, id),
          eq(transactions.destinationAccountId, id)
        )
      )
      .execute();

    let balance = 0;
    accountTransactions.forEach(t => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME' && t.accountId === id) {
        balance += amount;
      } else if (t.type === 'EXPENSE' && t.accountId === id) {
        balance -= amount;
      } else if (t.type === 'TRANSFER') {
        if (t.destinationAccountId === id) {
          balance += amount;
        }
        if (t.accountId === id) {
          balance -= amount;
        }
      } else if (t.type === 'SAVING' && t.accountId === id) {
        balance -= amount;
      } else if (t.type === 'WITHDRAWAL' && t.destinationAccountId === id) {
        balance += amount;
      }
    });

    // 2. If balance > 0, handle balance transfer unless skipTransfer is true
    if (balance > 0) {
      if (skipTransfer) {
        // Find or create "Penyesuaian" category for EXPENSE
        let category = await db.select().from(categories).where(
          and(
            eq(categories.userId, session.user.id),
            eq(categories.type, "EXPENSE"),
            sql`lower(${categories.name}) = lower('Penyesuaian')`
          )
        ).execute();

        let categoryId: string;
        if (category.length === 0) {
          categoryId = crypto.randomUUID();
          await db.insert(categories).values({
            id: categoryId,
            name: "Penyesuaian",
            userId: session.user.id,
            type: "EXPENSE"
          });
        } else {
          categoryId = category[0].id;
        }

        // Create a formal EXPENSE transaction representing the "lost" money
        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          amount: balance.toString(),
          description: `Penghapusan rekening (saldo dihapus) - ${accountData.name}`,
          date: new Date(),
          userId: session.user.id,
          type: 'EXPENSE',
          categoryId,
          accountId: id, 
          createdAt: new Date(),
        });
      } else {
        if (!destinationAccountId) {
          return { error: "Rekening memiliki saldo. Harap pilih rekening tujuan." };
        }

        // Record a TRANSFER to move the balance correctly
        // This ensures Total Income/Expense doesn't change, but individual account balances do
        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          amount: balance.toString(),
          description: `Pindahan saldo dari ${accountData.name} (Penutupan Rekening)`,
          date: new Date(),
          userId: session.user.id,
          type: 'TRANSFER',
          accountId: id,
          destinationAccountId: destinationAccountId,
          createdAt: new Date(),
        });
      }
    }

    // 3. Delete the account (this will cascade delete all original transactions)
    await db.delete(accounts).where(
      and(
        eq(accounts.id, id),
        eq(accounts.userId, session.user.id)
      )
    );
    
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return { error: "Failed to delete account" };
  }
}

export async function getAccounts() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return [];

  try {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, session.user.id)).execute();
    
    // For each account, calculate balance
    const accountsWithBalance = await Promise.all(userAccounts.map(async (acc) => {
      // Fetch all transactions for this account
      const accountTransactions = await db.select()
        .from(transactions)
        .where(
          or(
            eq(transactions.accountId, acc.id),
            eq(transactions.destinationAccountId, acc.id)
          )
        )
        .execute();

      let balance = 0;
      accountTransactions.forEach(t => {
        const amount = Number(t.amount);
        if (t.type === 'INCOME' && t.accountId === acc.id) {
          balance += amount;
        } else if (t.type === 'EXPENSE' && t.accountId === acc.id) {
          balance -= amount;
        } else if (t.type === 'TRANSFER') {
          if (t.destinationAccountId === acc.id) {
            balance += amount;
          }
          if (t.accountId === acc.id) {
            balance -= amount;
          }
        } else if (t.type === 'SAVING' && t.accountId === acc.id) {
          balance -= amount;
        } else if (t.type === 'WITHDRAWAL' && t.destinationAccountId === acc.id) {
          balance += amount;
        }
      });
      
      return {
        ...acc,
        balance
      };
    }));

    return accountsWithBalance;
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return [];
  }
}

export async function getTransferHistory(params?: { month?: number, year?: number, viewMode?: "monthly" | "yearly", page?: number, limit?: number }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) return { data: [], total: 0 };

  const { month, year, viewMode = "monthly", page = 1, limit = 10 } = params || {};
  const offset = (page - 1) * limit;

  try {
    const conditions = [
      eq(transactions.userId, session.user.id),
      eq(transactions.type, 'TRANSFER')
    ];

    if (viewMode === "monthly" && month !== undefined && year !== undefined) {
      // Drizzle way to filter by month/year on Date column
      conditions.push(sql`EXTRACT(MONTH FROM ${transactions.date}) = ${month}`);
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.date}) = ${year}`);
    } else if (viewMode === "yearly" && year !== undefined) {
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.date}) = ${year}`);
    }

    const dataQuery = db.select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      fromAccountName: sql<string>`COALESCE(${accounts}.name, '(Dihapus)')`,
      toAccountName: sql<string>`COALESCE(to_acc.name, '(Dihapus)')`,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(sql`${accounts} as to_acc`, eq(transactions.destinationAccountId, sql`to_acc.id`))
    .where(and(...conditions))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

    const countQuery = db.select({ count: sql`count(*)` })
      .from(transactions)
      .where(and(...conditions));

    const [data, countResult] = await Promise.all([
      dataQuery.execute(),
      countQuery.execute()
    ]);

    return {
      data,
      total: Number(countResult[0]?.count || 0)
    };
  } catch (error) {
    console.error("Failed to fetch transfer history:", error);
    return { data: [], total: 0 };
  }
}
