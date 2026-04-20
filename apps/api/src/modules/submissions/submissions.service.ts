import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { PrescriptionSubmission } from "@online-order-system/types";
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
    file: UploadedPrescriptionFile | undefined,
  ): Promise<PrescriptionSubmission> {
    const order = await this.workflowStore.getOrderById(orderId);
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException("Order not found");
    }

    const latestSubmission = order.latestSubmissionId
      ? await this.workflowStore.getSubmissionById(order.latestSubmissionId)
      : null;
    if (!latestSubmission || latestSubmission.status !== "rejected") {
      throw new BadRequestException(
        "Resubmission is allowed only after rejection",
      );
    }

    const upload = validateUploadedPrescriptionFile(file);
    const fileId = randomUUID();

    await this.fileStorage.save({
      fileId,
      fileName: upload.fileName,
      contentType: upload.contentType,
      body: upload.body,
    });

    try {
      return await this.workflowStore.resubmitOrder({
        customerId,
        orderId,
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

  async getById(submissionId: string) {
    const submission = await this.workflowStore.getSubmissionById(submissionId);
    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    return submission;
  }
}
