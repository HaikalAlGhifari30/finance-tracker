import 'dotenv/config';
import { auth } from "../src/lib/auth";
import { db } from "../src/db";
import { user, account } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const email = "bokal@gmail.com";
  const password = "bokaltesting123";

  console.log("Cleaning up existing user bokal@gmail.com on new DB...");
  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (existing.length > 0) {
    await db.delete(user).where(eq(user.id, existing[0].id));
  }

  console.log("Creating user via Better-Auth API...");
  const res = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: "Bokal",
    }
  });

  console.log("Result:", res);
  console.log("User bokal@gmail.com successfully created & verified via Better Auth!");
}

run().catch(console.error);
