import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { WORKFLOW_STORE } from "./common/tokens.js";
import { InMemoryWorkflowStore } from "./adapters/in-memory/in-memory-workflow-store.js";

const DEFAULT_API_PORT = 3002;
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];

function parsePort(rawPort: string | undefined): number {
  const parsedPort = Number.parseInt(rawPort ?? "", 10);
  return Number.isFinite(parsedPort) ? parsedPort : DEFAULT_API_PORT;
}

function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.WEB_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return configuredOrigins?.length
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS;
}

async function bootstrap() {
  const apiPort = parsePort(process.env.API_PORT ?? process.env.PORT);
  const allowedOrigins = new Set(getAllowedOrigins());
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    credentials: true,
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`), false);
    },
    optionsSuccessStatus: 204,
  });
  app.useLogger(["error", "warn", "log"]);
  const workflowStore = app.get<InMemoryWorkflowStore>(WORKFLOW_STORE);
  workflowStore.seed();
  await app.listen(apiPort);
}

void bootstrap();
