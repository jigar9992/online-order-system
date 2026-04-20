import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AuthSession,
  ReviewDecisionRequest,
} from "@online-order-system/types";
import { WORKFLOW_STORE } from "../../common/tokens.js";
import type {
  ReviewSubmissionInput,
  WorkflowStore,
} from "../../ports/workflow-store.port.js";

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(WORKFLOW_STORE) private readonly workflowStore: WorkflowStore,
  ) {}

  async listPending() {
    return this.workflowStore.listPendingSubmissions();
  }

  async approve(submissionId: string, user: AuthSession) {
    const submission = await this.workflowStore.getSubmissionById(submissionId);
    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new BadRequestException("Only pending submissions can be approved");
    }

    return this.workflowStore.approveSubmission({
      submissionId,
      actor: { actorId: user.userId, role: user.role },
    });
  }

  async reject(
    submissionId: string,
    user: AuthSession,
    body: ReviewDecisionRequest,
  ) {
    const submission = await this.workflowStore.getSubmissionById(submissionId);
    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new BadRequestException("Only pending submissions can be rejected");
    }

    if (!body.reason?.trim()) {
      throw new BadRequestException("Rejection reason is required");
    }

    const input: ReviewSubmissionInput = {
      submissionId,
      actor: { actorId: user.userId, role: user.role },
      reason: body.reason,
    };

    return this.workflowStore.rejectSubmission(input);
  }
}
