import { pool } from "@/db";
import { afterAll } from "vitest";

afterAll(async () => {
  await pool.end();
});
