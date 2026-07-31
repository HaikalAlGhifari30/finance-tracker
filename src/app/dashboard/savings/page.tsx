import { db } from "@/db";
import { transactions, categories, goals, accounts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { members } from "@/db/schema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SavingsClientPage from "./SavingsClientPage";
import { getAccounts } from "@/app/actions/accounts";

export default async function SavingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // 1. Fetch Goals
  const goalsData = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .execute();

  // 2. Fetch all user transactions for calculations
  const allUserTransactions = await db.select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .execute();

  // 3. Map goals with their specific balances calculated in JS
  const userGoals = goalsData.map(goal => {
      const goalBalance = allUserTransactions
        .filter(t => t.goalId === goal.id || t.destinationGoalId === goal.id)
        .reduce((sum, t) => {
            const amount = Number(t.amount);
            
            // 1. Handled by destinationGoalId (Always +)
            if (t.destinationGoalId === goal.id) {
                return sum + amount;
            }

            // 2. Handled by goalId (Source or direct saving)
            if (t.goalId === goal.id) {
                if (t.type === 'SAVING') return sum + amount;
                if (t.type === 'WITHDRAWAL') return sum - amount;
                if (t.type === 'EXPENSE' && !t.accountId) return sum - amount;
                
                if (t.type === 'ALLOCATION') {
                    // New logic: if it has a destination, this goal is the source (-)
                    // Old logic: if no destination, this goal was the destination (+)
                    if (t.destinationGoalId) return sum - amount;
                    return sum + amount; 
                }
            }
            
            return sum;
        }, 0);
      
      return {
          ...goal,
          balance: goalBalance
      };
  });

  // 4. Calculate Total Savings Pool (SAVING - WITHDRAWAL - EXPENSE_FROM_SAVINGS)
  // TRANSFER is ignored here because it's an internal movement (Total pool doesn't change)
  const totalSavingsPool = allUserTransactions.reduce((sum, t) => {
    const amount = Number(t.amount);
    if (t.type === 'SAVING') return sum + amount;
    if (t.type === 'WITHDRAWAL') return sum - amount;
    if (t.type === 'EXPENSE' && !t.accountId) return sum - amount;
    return sum;
  }, 0);

  // 5. Calculate Unallocated Savings (Total - All Allocated)
  const totalAllocated = userGoals.reduce((sum, g) => sum + g.balance, 0);
  const unallocatedSavings = totalSavingsPool - totalAllocated;

  // 6. Fetch Members and Accounts
  const membersData = await db.select().from(members).where(eq(members.userId, userId)).execute();
  const userAccounts = await getAccounts();

  // 7. Fetch Savings Transaction History
  const history = allUserTransactions
    .filter(t => t.type === 'SAVING' || t.type === 'WITHDRAWAL' || t.type === 'ALLOCATION' || (t.type === 'EXPENSE' && !t.accountId))
    .map(t => {
        const sourceGoal = goalsData.find(g => g.id === t.goalId);
        const destGoal = goalsData.find(g => g.id === t.destinationGoalId);
        const account = userAccounts.find(a => a.id === t.accountId);
        
        // Find member from transaction's memberId or fallback to account's memberId
        const memberId = t.memberId || account?.memberId;
        const member = membersData.find(m => m.id === memberId);
        
        return {
            id: t.id,
            amount: t.amount,
            description: t.description,
            date: t.date,
            type: t.type,
            goalId: t.goalId,
            goalName: sourceGoal?.name || "Tabungan Umum",
            destinationGoalId: t.destinationGoalId,
            destinationGoalName: destGoal?.name || "Tabungan Umum",
            accountId: t.accountId,
            memberName: member?.name
        };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <SavingsClientPage 
      totalSavingsPool={totalSavingsPool}
      unallocatedSavings={unallocatedSavings}
      goals={userGoals}
      history={history}
      accounts={userAccounts}
    />
  );
}
