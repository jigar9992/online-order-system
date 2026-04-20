import { Inject, Injectable } from "@nestjs/common";
import type { ReviewDecisionRequest } from "@online-order-system/types";
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

  async approve(submissionId: string) {
    return this.workflowStore.approveSubmission({
      submissionId,
      actor: { actorId: "user_admin", role: "admin" },
    });
  }

  async reject(submissionId: string, body: ReviewDecisionRequest) {
    const input: ReviewSubmissionInput = {
      submissionId,
      actor: { actorId: "user_admin", role: "admin" },
      ...(body.reason ? { reason: body.reason } : {}),
    };

    return this.workflowStore.rejectSubmission(input);
  }
}
