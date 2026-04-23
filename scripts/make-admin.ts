import { db } from "../src/db";
import { user } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) dotenv.config({ path: ".env" });
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error("Masukkan email! Penggunaan: npx tsx scripts/make-admin.ts user@example.com");
    process.exit(1);
  }
  
  const existingUser = await db.select().from(user).where(eq(user.email, email)).execute();
  if (existingUser.length === 0) {
    console.error(`User dengan email ${email} tidak ditemukan. Silakan Daftar dulu di halaman Login.`);
    process.exit(1);
  }

  await db.update(user).set({ role: "SUPERADMIN" }).where(eq(user.email, email)).execute();
  console.log(`Berhasil mengubah ${email} menjadi SUPERADMIN! Silahkan Refresh web.`);
  process.exit(0);
}

run();
