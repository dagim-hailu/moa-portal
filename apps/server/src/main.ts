import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./modules/app.module";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true, credentials: true });
  // Ensure uploads directory exists and serve it as static files
  const uploadsDir = join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(join(process.cwd(), "public"), { prefix: "/" });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
