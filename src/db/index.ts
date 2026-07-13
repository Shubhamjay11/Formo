import { env } from "@/lib/env";
import { eq, type Column } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });

/** Scope a tenant query: .where(and(withOrg(table.orgId, orgId), ...)) */
export function withOrg(orgIdColumn: Column, orgId: string) {
  return eq(orgIdColumn, orgId);
}
