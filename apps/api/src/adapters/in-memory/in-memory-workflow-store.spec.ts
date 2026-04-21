import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkflowStore } from "./in-memory-workflow-store.js";

describe("InMemoryWorkflowStore workflow rules", () => {
  let workflowStore: InMemoryWorkflowStore;

  beforeEach(() => {
    workflowStore = new InMemoryWorkflowStore();
    workflowStore.seed();
  });

  it("requires a rejection reason when rejecting a submission", async () => {
    const submission = await workflowStore.createSubmission({
      customerId: "user_customer",
      file: {
        fileId: "file_001",
        fileName: "rx.pdf",
        fileKind: "pdf",
        fileSize: 128,
      },
    });

    await expect(
      workflowStore.rejectSubmission({
        submissionId: submission.id,
        actor: { actorId: "user_admin", role: "admin" },
      }),
    ).rejects.toThrow("Rejection reason is required");
  });

  it("allows resubmission only after rejection", async () => {
    const submission = await workflowStore.createSubmission({
      customerId: "user_customer",
      file: {
        fileId: "file_001",
        fileName: "rx.pdf",
        fileKind: "pdf",
        fileSize: 128,
      },
    });

    await expect(
      workflowStore.resubmitOrder({
        customerId: "user_customer",
        orderId: submission.orderId,
        file: {
          fileId: "file_002",
          fileName: "replacement.pdf",
          fileKind: "pdf",
          fileSize: 256,
        },
      }),
    ).rejects.toThrow("Resubmission is allowed only after rejection");
  });

  it("preserves history across rejection and resubmission cycles", async () => {
    const submission = await workflowStore.createSubmission({
      customerId: "user_customer",
      file: {
        fileId: "file_001",
        fileName: "rx.pdf",
        fileKind: "pdf",
        fileSize: 128,
      },
    });

    await workflowStore.rejectSubmission({
      submissionId: submission.id,
      actor: { actorId: "user_admin", role: "admin" },
      reason: "Please upload a clearer image.",
    });

    const replacement = await workflowStore.resubmitOrder({
      customerId: "user_customer",
      orderId: submission.orderId,
      file: {
        fileId: "file_002",
        fileName: "replacement.pdf",
        fileKind: "pdf",
        fileSize: 256,
      },
    });

    const summary = await workflowStore.getOrderSummary(submission.orderId);

    expect(summary).toMatchObject({
      id: submission.orderId,
      latestSubmissionId: replacement.id,
      latestDecision: "pending",
      history: [
        {
          submissionId: submission.id,
          scope: "submission",
          status: "pending",
          reason: null,
        },
        {
          submissionId: submission.id,
          scope: "submission",
          status: "rejected",
          reason: "Please upload a clearer image.",
        },
        {
          submissionId: replacement.id,
          scope: "submission",
          status: "pending",
          reason: null,
        },
      ],
    });
  });

  it("marks approved orders as delivered and records an order-level history event", async () => {
    const submission = await workflowStore.createSubmission({
      customerId: "user_customer",
      file: {
        fileId: "file_001",
        fileName: "rx.pdf",
        fileKind: "pdf",
        fileSize: 128,
      },
    });

    await workflowStore.approveSubmission({
      submissionId: submission.id,
      actor: { actorId: "user_admin", role: "admin" },
    });

    await expect(
      workflowStore.markDelivered(submission.orderId, "user_admin"),
    ).resolves.toMatchObject({
      id: submission.orderId,
      status: "delivered",
    });

    const summary = await workflowStore.getOrderSummary(submission.orderId);

    expect(summary).toMatchObject({
      id: submission.orderId,
      status: "delivered",
      latestDecision: "approved",
      history: [
        {
          submissionId: submission.id,
          scope: "submission",
          status: "pending",
        },
        {
          submissionId: submission.id,
          scope: "submission",
          status: "approved",
        },
        {
          submissionId: null,
          scope: "order",
          status: "delivered",
        },
      ],
    });
  });

  it("rejects delivery before approval and after the order is already delivered", async () => {
    const submission = await workflowStore.createSubmission({
      customerId: "user_customer",
      file: {
        fileId: "file_001",
        fileName: "rx.pdf",
        fileKind: "pdf",
        fileSize: 128,
      },
    });

    await expect(
      workflowStore.markDelivered(submission.orderId, "user_admin"),
    ).rejects.toThrow("Transition from pending to delivered is not allowed");

    await workflowStore.approveSubmission({
      submissionId: submission.id,
      actor: { actorId: "user_admin", role: "admin" },
    });
    await workflowStore.markDelivered(submission.orderId, "user_admin");

    await expect(
      workflowStore.markDelivered(submission.orderId, "user_admin"),
    ).rejects.toThrow("Transition from delivered to delivered is not allowed");
  });
});
