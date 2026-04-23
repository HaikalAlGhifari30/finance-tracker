import { db } from "./src/db/index";
import { user } from "./src/db/schema";
import { inArray } from "drizzle-orm";

async function run() {
  await db.update(user)
    .set({ role: "SUPERADMIN" })
    .where(inArray(user.email, ["haikal@gmail.com", "admin@combiphar.com"]))
    .execute();
  console.log("Updated roles to SUPERADMIN");
  process.exit(0);
}
run();
