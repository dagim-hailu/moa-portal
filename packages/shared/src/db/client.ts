import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./index";

export type MoaDatabase = ReturnType<typeof createDb>["db"];

export function createDb(connectionString: string) {
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool, { schema });
  return { db, pool };
}
