import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./modules/app.module";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true, credentials: true });

  // Increase body-parser limits so large file uploads (handled by multer) are
  // not rejected by Express before the multipart interceptor can process them.
  app.use(require("express").json({ limit: "100mb" }));
  app.use(require("express").urlencoded({ extended: true, limit: "100mb" }));

  // Ensure uploads directory exists and serve it as static files
  const uploadsDir = join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(join(process.cwd(), "public"), { prefix: "/" });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
