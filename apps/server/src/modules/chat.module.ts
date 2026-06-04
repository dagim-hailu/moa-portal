import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatController } from "./chat.controller";
import { DatabaseModule } from "../db/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [ChatGateway],
  controllers: [ChatController],
})
export class ChatModule {}
