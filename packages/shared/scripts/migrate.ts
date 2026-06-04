import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "../drizzle/0000_init.sql");
const connectionString = process.env.DATABASE_URL ?? "postgres://moa:moa@localhost:5433/moa_portal";

async function migrate() {
  const pool = new pg.Pool({ connectionString });
  const sql = readFileSync(sqlPath, "utf8");
  await pool.query(sql);
  await pool.end();
  console.log("Migration applied.");
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
