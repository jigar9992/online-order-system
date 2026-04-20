import { Global, Module } from "@nestjs/common";
import { WORKFLOW_STORE } from "../common/tokens.js";
import { InMemoryWorkflowStore } from "../adapters/in-memory/in-memory-workflow-store.js";

@Global()
@Module({
  providers: [
    {
      provide: WORKFLOW_STORE,
      useClass: InMemoryWorkflowStore,
    },
  ],
  exports: [WORKFLOW_STORE],
})
export class WorkflowStoreModule {}
