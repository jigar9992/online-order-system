import type {
  AuthSession,
  FileKind,
  OrderSummary,
  PrescriptionSubmission,
  SubmissionStatus,
  UserRole,
} from "@online-order-system/types";
import { randomUUID } from "node:crypto";
import type {
  CreateSubmissionInput,
  ReviewSubmissionInput,
  WorkflowStore,
} from "../../ports/workflow-store.port.js";
import {
  assertOrderStatusTransition,
  assertSubmissionStatusTransition,
  type OrderRecord,
  type ReviewEvent,
  type SubmissionFile,
} from "../../domain/order-workflow.js";

type UserRecord = {
  id: string;
  email: string;
  role: UserRole;
  password: string;
};

type FileRecord = SubmissionFile;

function normalizeRejectionReason(value: string | undefined): string | null {
  const reason = value?.trim();
  return reason ? reason : null;
}

export class InMemoryWorkflowStore implements WorkflowStore {
  private readonly users = new Map<string, UserRecord>();

  private readonly submissions = new Map<string, PrescriptionSubmission>();

  private readonly orders = new Map<string, OrderRecord>();

  private readonly files = new Map<string, FileRecord>();

  private readonly events: ReviewEvent[] = [];

  seed(): void {
    this.users.clear();
    this.submissions.clear();
    this.orders.clear();
    this.files.clear();
    this.events.length = 0;

    this.users.set("customer@example.com", {
      id: "user_customer",
      email: "customer@example.com",
      role: "customer",
      password: "password",
    });

    this.users.set("admin@example.com", {
      id: "user_admin",
      email: "admin@example.com",
      role: "admin",
      password: "password",
    });
  }

  async authenticateUser(
    email: string,
    password: string,
  ): Promise<AuthSession | null> {
    const user = this.users.get(email);
    if (!user || user.password !== password) {
      return null;
    }

    return { userId: user.id, email: user.email, role: user.role };
  }

  async createSubmission(
    input: CreateSubmissionInput,
  ): Promise<PrescriptionSubmission> {
    const orderId = randomUUID();
    const now = new Date().toISOString();
    const fileId = randomUUID();

    this.files.set(fileId, { ...input.file, fileId });

    const order: OrderRecord = {
      id: orderId,
      customerId: input.customerId,
      status: "pending",
      latestSubmissionId: null,
      createdAt: now,
      updatedAt: now,
    };

    const submission: PrescriptionSubmission = {
      id: randomUUID(),
      orderId,
      customerId: input.customerId,
      fileId,
      fileName: input.file.fileName,
      fileKind: input.file.fileKind,
      status: "pending",
      rejectionReason: null,
      createdAt: now,
      reviewedAt: null,
    };

    order.latestSubmissionId = submission.id;
    this.orders.set(orderId, order);
    this.submissions.set(submission.id, submission);
    this.events.push({
      submissionId: submission.id,
      orderId: order.id,
      status: "pending",
      actorId: input.customerId,
      reason: null,
      createdAt: now,
    });

    return submission;
  }

  async listPendingSubmissions(): Promise<PrescriptionSubmission[]> {
    return [...this.submissions.values()].filter(
      (submission) => submission.status === "pending",
    );
  }

  async getSubmissionById(
    submissionId: string,
  ): Promise<PrescriptionSubmission | null> {
    return this.submissions.get(submissionId) ?? null;
  }

  async getOrderById(orderId: string): Promise<OrderRecord | null> {
    return this.orders.get(orderId) ?? null;
  }

  async getOrderSummary(orderId: string): Promise<OrderSummary | null> {
    const order = this.orders.get(orderId);
    if (!order) {
      return null;
    }

    const history = this.events
      .filter((event) => event.orderId === orderId)
      .map((event) => ({
        submissionId: event.submissionId,
        status: event.status,
        actorId: event.actorId,
        reason: event.reason,
        createdAt: event.createdAt,
      }));

    const latestSubmission = order.latestSubmissionId
      ? (this.submissions.get(order.latestSubmissionId) ?? null)
      : null;

    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      latestSubmissionId: order.latestSubmissionId,
      latestDecision: latestSubmission?.status ?? null,
      history,
    };
  }

  async getFileById(fileId: string): Promise<{
    id: string;
    fileName: string;
    fileKind: FileKind;
    fileSize: number;
  } | null> {
    const file = this.files.get(fileId);
    return file
      ? {
          id: file.fileId,
          fileName: file.fileName,
          fileKind: file.fileKind,
          fileSize: file.fileSize,
        }
      : null;
  }

  async approveSubmission(input: ReviewSubmissionInput) {
    const submission = this.submissions.get(input.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new Error("Only pending submissions can be approved");
    }

    const order = this.orders.get(submission.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const now = new Date().toISOString();
    assertSubmissionStatusTransition(submission.status, "approved");
    assertOrderStatusTransition(order.status, "approved");

    const updatedSubmission: PrescriptionSubmission = {
      ...submission,
      status: "approved",
      reviewedAt: now,
      rejectionReason: null,
    };
    const updatedOrder: OrderRecord = {
      ...order,
      status: "approved",
      updatedAt: now,
    };

    this.submissions.set(updatedSubmission.id, updatedSubmission);
    this.orders.set(updatedOrder.id, updatedOrder);

    const event: ReviewEvent = {
      submissionId: updatedSubmission.id,
      orderId: updatedOrder.id,
      status: "approved",
      actorId: input.actor.actorId,
      reason: null,
      createdAt: now,
    };
    this.events.push(event);

    return { submission: updatedSubmission, order: updatedOrder, event };
  }

  async rejectSubmission(input: ReviewSubmissionInput) {
    const submission = this.submissions.get(input.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new Error("Only pending submissions can be rejected");
    }

    const reason = normalizeRejectionReason(input.reason);
    if (!reason) {
      throw new Error("Rejection reason is required");
    }

    const order = this.orders.get(submission.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const now = new Date().toISOString();
    assertSubmissionStatusTransition(submission.status, "rejected");

    const updatedSubmission: PrescriptionSubmission = {
      ...submission,
      status: "rejected",
      reviewedAt: now,
      rejectionReason: reason,
    };

    this.submissions.set(updatedSubmission.id, updatedSubmission);

    const event: ReviewEvent = {
      submissionId: updatedSubmission.id,
      orderId: order.id,
      status: "rejected",
      actorId: input.actor.actorId,
      reason,
      createdAt: now,
    };
    this.events.push(event);

    return { submission: updatedSubmission, order, event };
  }

  async resubmitOrder(
    input: CreateSubmissionInput & { orderId: string },
  ): Promise<PrescriptionSubmission> {
    const order = this.orders.get(input.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const latestSubmission = order.latestSubmissionId
      ? (this.submissions.get(order.latestSubmissionId) ?? null)
      : null;
    if (latestSubmission?.status !== "rejected") {
      throw new Error("Resubmission is allowed only after rejection");
    }

    const now = new Date().toISOString();
    const fileId = randomUUID();
    this.files.set(fileId, { ...input.file, fileId });

    const submission: PrescriptionSubmission = {
      id: randomUUID(),
      orderId: order.id,
      customerId: input.customerId,
      fileId,
      fileName: input.file.fileName,
      fileKind: input.file.fileKind,
      status: "pending",
      rejectionReason: null,
      createdAt: now,
      reviewedAt: null,
    };

    const updatedOrder: OrderRecord = {
      ...order,
      latestSubmissionId: submission.id,
      status: "pending",
      updatedAt: now,
    };

    this.submissions.set(submission.id, submission);
    this.orders.set(updatedOrder.id, updatedOrder);
    this.events.push({
      submissionId: submission.id,
      orderId: updatedOrder.id,
      status: "pending",
      actorId: input.customerId,
      reason: null,
      createdAt: now,
    });

    return submission;
  }

  async markDelivered(orderId: string, actorId: string): Promise<OrderRecord> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    assertOrderStatusTransition(order.status, "delivered");
    const updatedOrder: OrderRecord = {
      ...order,
      status: "delivered",
      updatedAt: new Date().toISOString(),
    };
    this.orders.set(updatedOrder.id, updatedOrder);
    this.events.push({
      submissionId: order.latestSubmissionId ?? "",
      orderId: order.id,
      status: "approved" as SubmissionStatus,
      actorId,
      reason: "delivery update",
      createdAt: updatedOrder.updatedAt,
    });
    return updatedOrder;
  }

  async listFiles(): Promise<
    Array<{
      id: string;
      fileName: string;
      fileKind: FileKind;
      fileSize: number;
    }>
  > {
    return [...this.files.values()].map((file) => ({
      id: file.fileId,
      fileName: file.fileName,
      fileKind: file.fileKind,
      fileSize: file.fileSize,
    }));
  }
}
