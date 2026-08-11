import 'dotenv/config';
import { db } from "../src/db/index";
import { transactions, goals } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const allGoals = await db.select().from(goals).execute();
  const allTx = await db.select().from(transactions).execute();
  
  // Calculate goal balances using page.tsx logic
  const userGoals = allGoals.map(goal => {
      const goalBalance = allTx
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

  const totalSavingsPool = allTx.reduce((sum, t) => {
    const amount = Number(t.amount);
    if (t.type === 'SAVING') return sum + amount;
    if (t.type === 'WITHDRAWAL') return sum - amount;
    if (t.type === 'EXPENSE' && !t.accountId) return sum - amount;
    return sum;
  }, 0);

  const totalAllocated = userGoals.reduce((sum, g) => sum + g.balance, 0);
  const unallocatedSavings = totalSavingsPool - totalAllocated;

  console.log("\n=== USER GOALS WITH CALCULATED BALANCES ===");
  console.log(userGoals.map(g => ({ name: g.name, id: g.id, balance: g.balance })));
  console.log("Total Savings Pool:", totalSavingsPool);
  console.log("Total Allocated:", totalAllocated);
  console.log("Unallocated Savings (Tabungan Umum):", unallocatedSavings);

  console.log("\n=== SAVINGS / ALLOCATION / WITHDRAWAL TRANSACTIONS ===");
  const savingsTx = allTx.filter(t => t.type === 'SAVING' || t.type === 'WITHDRAWAL' || t.type === 'ALLOCATION');
  console.log(savingsTx.map(t => ({
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    goalId: t.goalId,
    destinationGoalId: t.destinationGoalId,
    goalName: allGoals.find(g => g.id === t.goalId)?.name || 'Tabungan Umum',
    destGoalName: allGoals.find(g => g.id === t.destinationGoalId)?.name || 'Tabungan Umum'
  })));

  process.exit(0);
}

run().catch(console.error);
