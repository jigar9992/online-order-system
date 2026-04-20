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
        { submissionId: submission.id, status: "pending", reason: null },
        {
          submissionId: submission.id,
          status: "rejected",
          reason: "Please upload a clearer image.",
        },
        { submissionId: replacement.id, status: "pending", reason: null },
      ],
    });
  });
});
