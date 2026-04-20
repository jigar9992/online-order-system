import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { WORKFLOW_STORE } from "./common/tokens.js";
import { InMemoryWorkflowStore } from "./adapters/in-memory/in-memory-workflow-store.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    credentials: true,
    origin: true,
  });
  app.useLogger(["error", "warn", "log"]);
  const workflowStore = app.get<InMemoryWorkflowStore>(WORKFLOW_STORE);
  workflowStore.seed();
  await app.listen(3000);
}

void bootstrap();
