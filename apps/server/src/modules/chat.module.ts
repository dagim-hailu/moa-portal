import { Module } from "@nestjs/common";
import { DatabaseModule } from "../db/database.module";
import { ChatResolver } from "./chat.resolver";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";

@Module({
  imports: [DatabaseModule],
  controllers: [ChatController],
  providers: [ChatResolver, ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
