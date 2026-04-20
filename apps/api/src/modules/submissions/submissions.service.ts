import { Inject, Injectable } from "@nestjs/common";
import type {
  CreateSubmissionRequest,
  PrescriptionSubmission,
} from "@online-order-system/types";
import { randomUUID } from "node:crypto";
import { FILE_STORAGE, WORKFLOW_STORE } from "../../common/tokens.js";
import type { FileStoragePort } from "../../ports/file-storage.port.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";
import {
  validateUploadedPrescriptionFile,
  type UploadedPrescriptionFile,
} from "./submission-upload.js";

@Injectable()
export class SubmissionsService {
  constructor(
    @Inject(WORKFLOW_STORE) private readonly workflowStore: WorkflowStore,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStoragePort,
  ) {}

  async create(
    customerId: string,
    file: UploadedPrescriptionFile | undefined,
  ): Promise<PrescriptionSubmission> {
    const upload = validateUploadedPrescriptionFile(file);
    const fileId = randomUUID();

    await this.fileStorage.save({
      fileId,
      fileName: upload.fileName,
      contentType: upload.contentType,
      body: upload.body,
    });

    try {
      return await this.workflowStore.createSubmission({
        customerId,
        file: {
          fileId,
          fileName: upload.fileName,
          fileKind: upload.fileKind,
          fileSize: upload.fileSize,
        },
      });
    } catch (error) {
      await this.fileStorage.delete(fileId);
      throw error;
    }
  }

  async resubmit(
    customerId: string,
    orderId: string,
    input: CreateSubmissionRequest,
  ): Promise<PrescriptionSubmission> {
    return this.workflowStore.resubmitOrder({
      customerId,
      orderId,
      file: {
        fileName: input.fileName,
        fileKind: input.fileKind,
        fileSize: input.fileSize,
      },
    });
  }

  async getById(submissionId: string) {
    return this.workflowStore.getSubmissionById(submissionId);
  }
}
