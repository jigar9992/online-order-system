import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AdminSubmissionDetail,
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

  async approve(
    submissionId: string,
    user: AuthSession,
  ): Promise<AdminSubmissionDetail> {
    const submission = await this.getSubmissionOrThrow(submissionId);

    if (submission.status !== "pending") {
      throw new BadRequestException("Only pending submissions can be approved");
    }

    const result = await this.workflowStore.approveSubmission({
      submissionId,
      actor: { actorId: user.userId, role: user.role },
    });

    return this.buildSubmissionDetail(result.submission);
  }

  async reject(
    submissionId: string,
    user: AuthSession,
    body: ReviewDecisionRequest,
  ): Promise<AdminSubmissionDetail> {
    const submission = await this.getSubmissionOrThrow(submissionId);

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

    const result = await this.workflowStore.rejectSubmission(input);

    return this.buildSubmissionDetail(result.submission);
  }

  async deliver(
    orderId: string,
    user: AuthSession,
  ): Promise<{ order: AdminSubmissionDetail["order"] }> {
    const order = await this.workflowStore.getOrderById(orderId);
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.status !== "approved") {
      throw new BadRequestException("Only approved orders can be delivered");
    }

    await this.workflowStore.markDelivered(orderId, user.userId);

    return {
      order: await this.getOrderSummaryOrThrow(orderId),
    };
  }

  private async buildSubmissionDetail(
    submission: AdminSubmissionDetail["submission"],
  ): Promise<AdminSubmissionDetail> {
    return {
      submission,
      order: await this.getOrderSummaryOrThrow(submission.orderId),
    };
  }

  private async getSubmissionOrThrow(submissionId: string) {
    const submission = await this.workflowStore.getSubmissionById(submissionId);
    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    return submission;
  }

  private async getOrderSummaryOrThrow(orderId: string) {
    const order = await this.workflowStore.getOrderSummary(orderId);
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }
}
