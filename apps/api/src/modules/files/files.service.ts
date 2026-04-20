import { Inject, Injectable } from "@nestjs/common";
import { WORKFLOW_STORE } from "../../common/tokens.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";

@Injectable()
export class FilesService {
  constructor(
    @Inject(WORKFLOW_STORE) private readonly workflowStore: WorkflowStore,
  ) {}

  async listFiles() {
    return this.workflowStore.listFiles();
  }

  async getFile(fileId: string) {
    return this.workflowStore.getFileById(fileId);
  }
}
