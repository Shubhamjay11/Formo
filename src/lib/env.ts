import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
});

function parseEnv() {
  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  });

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(
      `Invalid environment variables:\n${JSON.stringify(formatted, null, 2)}`,
    );
  }

  return result.data;
}

export const env = parseEnv();
