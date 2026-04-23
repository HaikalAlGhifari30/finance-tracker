import { db } from "@/db";
import { categories, expenses, goals } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ExpensesClientPage from "./ExpensesClientPage";

export default async function ExpensesListPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const list = await db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      description: expenses.description,
      date: expenses.date,
      categoryId: expenses.categoryId,
      categoryName: categories.name,
      source: expenses.source,
      goalId: expenses.goalId
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(eq(expenses.userId, userId), eq(categories.type, "EXPENSE")))
    .orderBy(desc(expenses.date))
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

  return (
    <ExpensesClientPage 
      initialExpenses={list} 
      categories={userCategories} 
      goals={userGoals}
    />
  );
}
