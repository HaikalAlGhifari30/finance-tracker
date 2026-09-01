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
        expiresIn: 60 * 60 * 24 * 365, // Sesi berlaku 1 tahun agar pengguna tetap login dan tidak perlu berulang kali login
        updateAge: 60 * 60 * 24 * 7, // Hanya update updatedAt di DB Neon 7 hari sekali (menghemat query & storage DB)
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache sesi di cookie untuk menghemat query DB ke Neon
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
            },
            isActive: {
                type: "boolean",
                required: false,
                defaultValue: true
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
