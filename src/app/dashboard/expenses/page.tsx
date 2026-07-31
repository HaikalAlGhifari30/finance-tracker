import { db } from "@/db";
import { categories, transactions, goals, accounts, members as membersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ExpensesClientPage from "./ExpensesClientPage";
import { getAccounts } from "@/app/actions/accounts";
import { getMembers } from "@/app/actions/members";

export default async function ExpensesListPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const list = await db
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
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(membersTable, eq(transactions.memberId, membersTable.id))
    .where(and(eq(transactions.userId, userId), eq(transactions.type, "EXPENSE")))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .execute();

  let userCategories = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.type, "EXPENSE")))
    .execute();

  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .execute();

  const userAccounts = await getAccounts();
  const members = await getMembers();

  // Seed default categories if none exist for this type
  if (userCategories.length === 0) {
    const defaultCategoryNames = [
      "Makan", "Kosan", "Listrik", "Jajan", "Kuota", 
      "Hiburan", "Transportasi", "Tak Terduga", "Transfer Keluarga", "Tabungan"
    ];
    
    const seedData = defaultCategoryNames.map(name => ({
      id: crypto.randomUUID(),
      name,
      userId: userId,
      type: "EXPENSE"
    }));

    await db.insert(categories).values(seedData).execute();
    
    userCategories = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.type, "EXPENSE")))
      .execute();
  }

  // Calculate total savings pool
  const allSavingsRelated = await db
    .select({
      type: transactions.type,
      amount: transactions.amount,
      accountId: transactions.accountId
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        sql`${transactions.type} IN ('SAVING', 'WITHDRAWAL') OR (${transactions.type} = 'EXPENSE' AND ${transactions.accountId} IS NULL)`
      )
    )
    .execute();

  const totalSavings = allSavingsRelated.reduce((acc, t) => {
    const amt = Number(t.amount);
    if (t.type === 'SAVING') return acc + amt;
    return acc - amt; // WITHDRAWAL or EXPENSE from savings
  }, 0);

  return (
    <ExpensesClientPage 
      initialExpenses={list} 
      categories={userCategories} 
      goals={userGoals}
      accounts={userAccounts}
      totalSavings={totalSavings}
      members={members}
    />
  );
}
