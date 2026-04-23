import { db } from "@/db";
import { income, categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import IncomeClientPage from "./IncomeClientPage";

export default async function IncomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Fixed Query: Avoid filtering on the right side of a left join in the WHERE clause.
  // This prevents records from being excluded if they have no category or an invalid type.
  const incomeList = await db
    .select({
      id: income.id,
      amount: income.amount,
      description: income.description,
      date: income.date,
      categoryId: income.categoryId,
      categoryName: categories.name,
    })
    .from(income)
    .leftJoin(
      categories, 
      and(
        eq(income.categoryId, categories.id),
        // Scoping the join to only include INCOME categories
        // We handle the potential missing column error gracefully if needed, 
        // but physically the DB needs this column for the logic to be 100% correct.
        eq(categories.type, "INCOME") 
      )
    )
    .where(eq(income.userId, userId))
    .orderBy(desc(income.date))
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

  return (
    <IncomeClientPage 
      initialIncome={incomeList} 
      categories={userCategories} 
    />
  );
}
