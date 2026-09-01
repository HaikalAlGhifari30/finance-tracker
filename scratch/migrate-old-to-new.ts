import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const oldUrl = "postgresql://neondb_owner:npg_CqIMORAP50Jn@ep-little-credit-anq6nw8h-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const newUrl = process.env.DATABASE_URL!;

const oldSql = neon(oldUrl);
const newSql = neon(newUrl);

async function run() {
  console.log("Attempting to fetch data from old database...");
  try {
    const users = await oldSql`SELECT * FROM "user";`;
    console.log("Found old users:", users.length);
    const tx = await oldSql`SELECT * FROM "transactions";`;
    console.log("Found old transactions:", tx.length);
    const goals = await oldSql`SELECT * FROM "goals";`;
    console.log("Found old goals:", goals.length);
    const accounts = await oldSql`SELECT * FROM "accounts";`;
    console.log("Found old accounts:", accounts.length);
    const goldAssets = await oldSql`SELECT * FROM "gold_assets";`;
    console.log("Found old gold_assets:", goldAssets.length);
    const goldTx = await oldSql`SELECT * FROM "gold_transactions";`;
    console.log("Found old gold_transactions:", goldTx.length);

    console.log("\nStarting data migration to new DB...");
    // 1. Users
    for (const u of users) {
      await newSql`
        INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, npwp, "phoneNumber")
        VALUES (${u.id}, ${u.name}, ${u.email}, ${u.emailVerified}, ${u.image}, ${u.createdAt}, ${u.updatedAt}, ${u.role}, ${u.npwp}, ${u.phoneNumber})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    // 2. Accounts
    for (const a of accounts) {
      await newSql`
        INSERT INTO "accounts" (id, name, type, balance, "isOwner", "isActive", "createdAt")
        VALUES (${a.id}, ${a.name}, ${a.type}, ${a.balance}, ${a.isOwner}, ${a.isActive}, ${a.createdAt})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    // 3. Goals
    for (const g of goals) {
      await newSql`
        INSERT INTO "goals" (id, name, "targetAmount", "currentAmount", "targetDate", "isMain", "createdAt")
        VALUES (${g.id}, ${g.name}, ${g.targetAmount}, ${g.currentAmount}, ${g.targetDate}, ${g.isMain}, ${g.createdAt})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    // 4. Gold Assets
    for (const ga of goldAssets) {
      await newSql`
        INSERT INTO "gold_assets" (id, "totalGram", "averageBuyPrice", "createdAt", "updatedAt")
        VALUES (${ga.id}, ${ga.totalGram}, ${ga.averageBuyPrice}, ${ga.createdAt}, ${ga.updatedAt})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    // 5. Transactions
    for (const t of tx) {
      await newSql`
        INSERT INTO "transactions" (id, type, amount, description, date, "accountId", "destinationAccountId", "goalId", "destinationGoalId", "memberId", "goldGram", "goldPricePerGram", "createdAt")
        VALUES (${t.id}, ${t.type}, ${t.amount}, ${t.description}, ${t.date}, ${t.accountId}, ${t.destinationAccountId}, ${t.goalId}, ${t.destinationGoalId}, ${t.memberId}, ${t.goldGram}, ${t.goldPricePerGram}, ${t.createdAt})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    // 6. Gold Transactions
    for (const gt of goldTx) {
      await newSql`
        INSERT INTO "gold_transactions" (id, type, gram, "pricePerGram", "totalPrice", "transactionId", "createdAt")
        VALUES (${gt.id}, ${gt.type}, ${gt.gram}, ${gt.pricePerGram}, ${gt.totalPrice}, ${gt.transactionId}, ${gt.createdAt})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log("MIGRATION COMPLETED SUCCESSFULLY!");
  } catch (err: any) {
    console.error("Migration Error:", err.message);
  }
}

run().catch(console.error);
