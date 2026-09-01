import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  console.log("Adding isActive column to user table...");
  await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true NOT NULL;`;
  console.log("Column isActive added successfully!");
}

run().catch(console.error);
