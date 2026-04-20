import { Inject, Injectable } from "@nestjs/common";
import type {
  CreateSubmissionRequest,
  PrescriptionSubmission,
} from "@online-order-system/contracts";
import { WORKFLOW_STORE } from "../../common/tokens.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";

@Injectable()
export class SubmissionsService {
  constructor(
    @Inject(WORKFLOW_STORE) private readonly workflowStore: WorkflowStore,
  ) {}

  async create(
    customerId: string,
    input: CreateSubmissionRequest,
  ): Promise<PrescriptionSubmission> {
    return this.workflowStore.createSubmission({
      customerId,
      file: {
        fileName: input.fileName,
        fileKind: input.fileKind,
        fileSize: input.fileSize,
      },
    });
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
