import { DatabaseService } from "./apps/server/src/db/database.service";

async function run() {
  const db = new DatabaseService();
  await db.onModuleInit();
  console.log("Database initialized");

  const rows = await db.getChatHistory("00000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000004");
  console.log("Rows length:", rows.length);
  if (rows.length > 0) {
    console.log("First row ID:", rows[0].id);
    console.log("First row Content:", rows[0].content);
  }
  await db.onModuleDestroy();
}

run().catch(console.error);
