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

  if (!session?.user) redirect("/");

  const userId = session.user.id;

  const [incomeList, rawCategories, userAccounts, members] = await Promise.all([
    db.select({
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
    .execute(),

    db.select().from(categories).where(and(eq(categories.userId, userId), eq(categories.type, "INCOME"))).execute(),
    db.select().from(accounts).where(eq(accounts.userId, userId)).execute(),
    getMembers()
  ]);

  let userCategories = rawCategories;

  return (
    <IncomeClientPage 
      initialIncome={incomeList} 
      categories={userCategories} 
      accounts={userAccounts}
      members={members}
    />
  );
}
