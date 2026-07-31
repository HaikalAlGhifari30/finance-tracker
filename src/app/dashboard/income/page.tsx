import { db } from "@/db";
import { transactions, categories, accounts, members as membersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMembers } from "@/app/actions/members";
import IncomeClientPage from "./IncomeClientPage";

export default async function IncomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const incomeList = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      accountId: transactions.accountId,
      accountName: sql<string>`COALESCE(${accounts.name}, '(Dihapus)')`,
      memberId: transactions.memberId,
      memberName: membersTable.name,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(membersTable, eq(transactions.memberId, membersTable.id))
    .where(and(eq(transactions.userId, userId), eq(transactions.type, "INCOME")))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .execute();

  let userCategories = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.type, "INCOME")))
    .execute();

  // Seed default categories if none exist for INCOME
  if (userCategories.length === 0) {
    const defaultCategoryNames = ["Gaji", "Bonus", "Investasi", "Penjualan", "Lainnya"];
    
    const seedData = defaultCategoryNames.map(name => ({
      id: crypto.randomUUID(),
      name,
      userId: userId,
      type: "INCOME"
    }));

    await db.insert(categories).values(seedData).execute();
    
    userCategories = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.type, "INCOME")))
      .execute();
  }

  const userAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .execute();

  const members = await getMembers();

  return (
    <IncomeClientPage 
      initialIncome={incomeList} 
      categories={userCategories} 
      accounts={userAccounts}
      members={members}
    />
  );
}
