import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AuthModule } from "./auth.module";
import { RegistryModule } from "./registry.module";
import { DmsModule } from "./dms.module";
import { PortalModule } from "./portal.module";
import { ChatModule } from "./chat.module";
import { HealthController } from "./health.controller";
import { DatabaseModule } from "../db/database.module";

@Module({
  controllers: [HealthController],
  imports: [
    DatabaseModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "public"),
      serveRoot: "/",
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: "/graphql",
      sortSchema: true,
      context: ({ req }: { req: { headers: Record<string, string | string[] | undefined> } }) => ({ req }),
    }),
    AuthModule,
    RegistryModule,
    PortalModule,
    DmsModule,
    ChatModule,
  ],
})
export class AppModule {}
