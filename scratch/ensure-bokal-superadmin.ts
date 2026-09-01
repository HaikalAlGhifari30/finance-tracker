import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  console.log("Ensuring bokal@gmail.com has SUPERADMIN role...");
  const res = await sql`
    UPDATE "user" 
    SET role = 'SUPERADMIN', "isActive" = true 
    WHERE email = 'bokal@gmail.com'
    RETURNING id, name, email, role, "isActive";
  `;
  console.log("Updated user:", res);
}

run().catch(console.error);
