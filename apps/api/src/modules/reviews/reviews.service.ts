import { Inject, Injectable } from "@nestjs/common";
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
    const input: ReviewSubmissionInput = {
      submissionId,
      actor: { actorId: user.userId, role: user.role },
      ...(body.reason ? { reason: body.reason } : {}),
    };

    return this.workflowStore.rejectSubmission(input);
  }
}
