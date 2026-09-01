import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification
        }
    }),
    session: {
        expiresIn: 60 * 60 * 24 * 30, // Sesi berlaku 30 hari agar user tidak perlu berulang kali login
        updateAge: 60 * 60 * 24 * 7, // Hanya update updatedAt di DB Neon 7 hari sekali (bukan tiap hari/request)
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache sesi di cookie selama 5 menit untuk menghemat query DB ke Neon
        }
    },
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "USER"
            }
        }
    },
    plugins: [
        nextCookies()
    ],
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.BETTER_AUTH_URL || ""
    ].filter(Boolean),
    debug: process.env.NODE_ENV !== "production"
});
