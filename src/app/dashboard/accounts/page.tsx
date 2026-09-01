import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAccounts, getTransferHistory } from "@/app/actions/accounts";
import { getMembers } from "@/app/actions/members";
import AccountsClient from "./AccountsClient";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AccountsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [accounts, members, transferResult, userCategories] = await Promise.all([
    getAccounts(),
    getMembers(),
    getTransferHistory({ 
      month: currentMonth, 
      year: currentYear, 
      viewMode: "monthly",
      page: 1,
      limit: 10 
    }),
    db.select().from(categories).where(eq(categories.userId, session.user.id)).execute()
  ]);

  return (
    <AccountsClient 
      initialAccounts={accounts} 
      initialTransferHistory={transferResult.data}
      initialTransferTotal={transferResult.total}
      user={session.user}
      categories={userCategories}
      members={members}
    />
  );
}
