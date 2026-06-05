import { DatabaseService } from "./apps/server/src/db/database.service";

async function run() {
  const db = new DatabaseService();
  await db.onModuleInit();
  
  const query = db.db
      .select()
      .from(db.db._.schema.chatMessages)
      .toSQL();

  console.log("SQL:", query);
  await db.onModuleDestroy();
}

run().catch(console.error);
