import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { FILE_STORAGE, WORKFLOW_STORE } from "../../common/tokens.js";
import type { FileStoragePort } from "../../ports/file-storage.port.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";

@Injectable()
export class FilesService {
  constructor(
    @Inject(WORKFLOW_STORE) private readonly workflowStore: WorkflowStore,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStoragePort,
  ) {}

  async listFiles() {
    return this.workflowStore.listFiles();
  }

  async getFile(fileId: string) {
    const metadata = await this.workflowStore.getFileById(fileId);
    if (!metadata) {
      throw new NotFoundException("File not found");
    }

    const file = await this.fileStorage.read(fileId);
    if (!file) {
      throw new NotFoundException("File not found");
    }

    return file;
  }
}
