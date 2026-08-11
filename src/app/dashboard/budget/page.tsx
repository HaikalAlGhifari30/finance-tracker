import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getBudgetPeriod, getCategoryExpensesForPeriod } from "@/app/actions/budget";
import { db } from "@/db";
import { categories, members as membersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import BudgetClientPage from "./BudgetClientPage";
import { getMembers } from "@/app/actions/members";
import { getAccounts } from "@/app/actions/accounts";

export default async function BudgetPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/");

  const now = new Date();
  const currentMonth = (now.getMonth() + 1).toString();
  const currentYear = now.getFullYear().toString();

  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, session.user.id))
    .execute();

  const members = await getMembers();
  const accounts = await getAccounts();

  return (
    <BudgetClientPage 
      allCategories={allCategories}
      initialMonth={currentMonth}
      initialYear={currentYear}
      members={members}
      accounts={accounts}
    />
  );
}
