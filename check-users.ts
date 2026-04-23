import { db } from "./src/db/index";
import { user } from "./src/db/schema";

async function get() {
  const users = await db.select().from(user).execute();
  console.log(users);
  process.exit(0);
}
get();
