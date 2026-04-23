import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
config({ path: join(__dirname, "../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function createAdmin() {
  const email = "admin@gmail.com"; 
  const password = "adminpassword"; 
  const name = "Super Admin";

  console.log(`Creating Admin: ${email}...`);

  try {
    const hashed = await hashPassword(password);
    const now = new Date();
    const userId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);
    const accountId = crypto.randomUUID().replace(/-/g, "").substring(0, 32);

    // Using query() for manual parameters
    await sql.query(`
      INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `, [userId, name, email, false, "SUPERADMIN", now, now]);

    await sql.query(`
      INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [accountId, userId, email, "email-password", hashed, now, now]);

    console.log("✅ SuperAdmin created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("Please delete this script after use.");
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
}

createAdmin();
