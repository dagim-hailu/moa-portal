import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { and, or, eq, isNull } from "drizzle-orm";
import { chatMessages } from "./packages/shared/src/db/index.ts";

const pool = new pg.Pool({ connectionString: "postgresql://neondb_owner:npg_qGPCF29nXRSD@ep-super-cell-aquaja1e-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" });
const db = drizzle(pool);

async function run() {
  const rows = await db.select().from(chatMessages).where(
    and(
      isNull(chatMessages.roomId),
      isNull(chatMessages.deletedAt),
      or(
        and(eq(chatMessages.senderId, "00000000-0000-4000-8000-000000000002"), eq(chatMessages.receiverId, "00000000-0000-4000-8000-000000000004")),
        and(eq(chatMessages.senderId, "00000000-0000-4000-8000-000000000004"), eq(chatMessages.receiverId, "00000000-0000-4000-8000-000000000002"))
      )
    )
  );
  console.log("Rows returned:", rows.length);
  console.log(rows);
  pool.end();
}
run();
