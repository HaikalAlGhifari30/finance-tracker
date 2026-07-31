import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, asc } from 'drizzle-orm';
import * as schema from './src/db/schema';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log("Starting cleanup...");
  
  // Find all owner members
  const ownerMembers = await db
    .select()
    .from(schema.members)
    .where(eq(schema.members.isOwner, true))
    .orderBy(asc(schema.members.createdAt))
    .execute();

  if (ownerMembers.length <= 1) {
    console.log("No duplicates found.");
    return;
  }

  // Group by userId
  const groupedByUser = ownerMembers.reduce((acc, member) => {
    if (!acc[member.userId]) {
      acc[member.userId] = [];
    }
    acc[member.userId].push(member);
    return acc;
  }, {} as Record<string, typeof ownerMembers>);

  for (const userId in groupedByUser) {
    const userOwners = groupedByUser[userId];
    if (userOwners.length > 1) {
      console.log(`User ${userId} has ${userOwners.length} owners. Cleaning up...`);
      
      const trueOwner = userOwners[0];
      const duplicates = userOwners.slice(1);
      
      console.log(`True owner is ${trueOwner.id}. Will reassign and delete ${duplicates.length} duplicates.`);

      for (const dup of duplicates) {
        // Reassign transactions
        await db.update(schema.transactions)
          .set({ memberId: trueOwner.id })
          .where(eq(schema.transactions.memberId, dup.id));
          
        // Reassign accounts
        await db.update(schema.accounts)
          .set({ memberId: trueOwner.id })
          .where(eq(schema.accounts.memberId, dup.id));
          
        // Reassign budget periods
        await db.update(schema.budgetPeriods)
          .set({ memberId: trueOwner.id })
          .where(eq(schema.budgetPeriods.memberId, dup.id));
          
        // Delete duplicate member
        await db.delete(schema.members).where(eq(schema.members.id, dup.id));
      }
      
      // Update the true owner's name to "Haikal" since user specifically asked "kok tidak ada saldo haikal"
      await db.update(schema.members)
        .set({ name: "Haikal" })
        .where(eq(schema.members.id, trueOwner.id));
        
      console.log(`Cleanup complete for user ${userId}. True owner name set to Haikal.`);
    }
  }
  
  console.log("Finished cleanup.");
}

main().catch(console.error);
