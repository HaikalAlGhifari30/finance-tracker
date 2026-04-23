import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Pastikan DATABASE_URL sudah disetting di .env
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
