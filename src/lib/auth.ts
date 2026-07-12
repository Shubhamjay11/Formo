import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";
import { env } from "@/lib/env";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: authSchema,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  advanced: {
    database: { generateId: "uuid" },
  },
  plugins: [nextCookies()],
});
