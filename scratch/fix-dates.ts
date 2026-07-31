import dotenv from "dotenv";
dotenv.config(); // Fallback to current working directory load

import { db } from "../src/db";
import { transactions } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function fixTransferDates() {
  console.log("Starting correction of transfer transaction dates...");
  
  const list = await db.select().from(transactions).where(eq(transactions.type, "TRANSFER")).execute();
  
  let count = 0;
  for (const tx of list) {
    const rawDateStr = tx.date instanceof Date ? tx.date.toISOString() : String(tx.date);
    
    // If date contains 2026-07-31 but description indicates transfer from/to or testing (meaning it happened on Aug 1st local WIB)
    if (rawDateStr.includes("2026-07-31") && (
      (tx.description && tx.description.toLowerCase().includes("testing")) || 
      (tx.description && tx.description.toLowerCase().includes("transfer dari"))
    )) {
      console.log(`Fixing transaction ID ${tx.id}: Current Date ${rawDateStr}`);
      
      // Update date strictly to 2026-08-01 local representation
      await db.update(transactions)
        .set({
          date: new Date("2026-08-01T02:00:00") // Set into August 1st WIB timezone time
        })
        .where(eq(transactions.id, tx.id))
        .execute();
        
      count++;
    }
  }
  
  console.log(`Successfully moved ${count} transactions from 31 July back to 1 August!`);
  process.exit(0);
}

fixTransferDates().catch(err => {
  console.error(err);
  process.exit(1);
});
