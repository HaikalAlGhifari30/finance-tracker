import 'dotenv/config';
import { db } from "../src/db";
import { user } from "../src/db/schema";

async function check() {
  const users = await db.select().from(user);
  console.log("Registered users in DB:");
  console.log(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));
}

check().catch(console.error);
