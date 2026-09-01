import { db } from "../db";
import { user } from "../db/schema";
import { config } from "dotenv";
config();

async function checkUserImages() {
  const users = await db.select().from(user);
  for (const u of users) {
    console.log(`User: ${u.name} (${u.email})`);
    console.log(`  Image length: ${u.image ? u.image.length : 0} chars`);
    if (u.image && u.image.length > 5000) {
      console.log(`  ⚠️ HUGE IMAGE DETECTED for user ${u.name} (${u.image.length} chars)! Resetting image to null...`);
      await db.update(user).set({ image: null }).where(eq(user.id, u.id));
    }
  }
}

import { eq } from "drizzle-orm";
checkUserImages().catch(console.error);
