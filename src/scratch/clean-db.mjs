import { neon } from '@neondatabase/serverless';
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

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

async function cleanDB() {
  console.log("Cleaning database...");
  try {
    // Truncate in order of dependencies (or use CASCADE)
    await sql.query(`TRUNCATE TABLE income, expenses, goals, categories, session, account, verification, "user" CASCADE`);
    console.log("✅ Database cleaned successfully!");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
  }
}

cleanDB();
