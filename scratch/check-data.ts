import 'dotenv/config';
import { db } from "../src/db/index";
import { transactions, goals, accounts } from "../src/db/schema";

async function run() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Exists" : "Missing");
  
  const allAccounts = await db.select().from(accounts).execute();
  console.log("\n=== ACCOUNTS ===");
  console.log(allAccounts.map(a => ({ id: a.id, name: a.name, type: a.type })));

  const allGoals = await db.select().from(goals).execute();
  console.log("\n=== GOALS ===");
  console.log(allGoals.map(g => ({ id: g.id, name: g.name, isMain: g.isMain })));

  const allTx = await db.select().from(transactions).execute();
  console.log("\n=== TRANSACTIONS ===");
  console.log(allTx.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    description: t.description,
    accountId: t.accountId,
    destinationAccountId: t.destinationAccountId,
    goalId: t.goalId,
    destinationGoalId: t.destinationGoalId,
  })));

  process.exit(0);
}

run().catch(console.error);
