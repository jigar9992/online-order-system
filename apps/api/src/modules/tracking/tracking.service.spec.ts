import { NotFoundException } from "@nestjs/common";
import type { OrderSummary } from "@online-order-system/types";
import { describe, expect, it, vi } from "vitest";
import { TrackingService } from "./tracking.service.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";

function createWorkflowStore(summary: OrderSummary | null): WorkflowStore {
  return {
    seed: vi.fn(),
    authenticateUser: vi.fn(),
    createSubmission: vi.fn(),
    listPendingSubmissions: vi.fn(),
    getSubmissionById: vi.fn(),
    getOrderById: vi.fn(),
    getOrderSummary: vi.fn().mockResolvedValue(summary),
    getFileById: vi.fn(),
    approveSubmission: vi.fn(),
    rejectSubmission: vi.fn(),
    resubmitOrder: vi.fn(),
    markDelivered: vi.fn(),
    listFiles: vi.fn(),
  };
}

describe("TrackingService", () => {
  it("returns the order summary for the owning customer", async () => {
    const summary: OrderSummary = {
      id: "order_123",
      customerId: "user_customer",
      status: "pending",
      latestSubmissionId: "sub_001",
      latestDecision: "pending",
      history: [],
    };
    const workflowStore = createWorkflowStore(summary);
    const service = new TrackingService(workflowStore);

    await expect(
      service.getOrder("order_123", "user_customer"),
    ).resolves.toEqual(summary);
  });

  it("hides orders that are not owned by the current customer", async () => {
    const workflowStore = createWorkflowStore({
      id: "order_123",
      customerId: "user_customer",
      status: "pending",
      latestSubmissionId: "sub_001",
      latestDecision: "pending",
      history: [],
    });
    const service = new TrackingService(workflowStore);

    await expect(
      service.getOrder("order_123", "user_other"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
