import { DatabaseService } from "./apps/server/src/db/database.service";
import { and, or, eq, isNull } from "drizzle-orm";
import { chatMessages } from "./packages/shared/src/db/index";

async function run() {
  const dbService = new DatabaseService();
  await dbService.onModuleInit();
  const db = dbService.db;
  
  const userA = "00000000-0000-4000-8000-000000000002";
  const userB = "00000000-0000-4000-8000-000000000004";

  const query = db
      .select()
      .from(chatMessages)
      .where(
        and(
          isNull(chatMessages.roomId),
          isNull(chatMessages.deletedAt),
          or(
            and(eq(chatMessages.senderId, userA), eq(chatMessages.receiverId, userB)),
            and(eq(chatMessages.senderId, userB), eq(chatMessages.receiverId, userA)),
          ),
        ),
      )
      .toSQL();

  console.log("SQL:", query.sql);
  console.log("PARAMS:", query.params);
  await dbService.onModuleDestroy();
}

run().catch(console.error);
