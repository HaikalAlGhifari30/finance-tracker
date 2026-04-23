import { auth } from "@/lib/auth";
import { nextCookies } from "better-auth/next-js";

export const GET = auth.handler;
export const POST = auth.handler;
