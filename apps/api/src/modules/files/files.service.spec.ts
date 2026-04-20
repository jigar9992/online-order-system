import { NotFoundException } from "@nestjs/common";
import type { AuthSession } from "@online-order-system/types";
import { describe, expect, it, vi } from "vitest";
import { FilesService } from "./files.service.js";
import type { FileStoragePort } from "../../ports/file-storage.port.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";

function createWorkflowStore(customerId: string): WorkflowStore {
  return {
    seed: vi.fn(),
    authenticateUser: vi.fn(),
    createSubmission: vi.fn(),
    listPendingSubmissions: vi.fn(),
    getSubmissionById: vi.fn(),
    getOrderById: vi.fn(),
    getOrderSummary: vi.fn(),
    getFileById: vi.fn().mockResolvedValue({
      id: "file_123",
      orderId: "order_123",
      customerId,
      fileName: "rx.pdf",
      fileKind: "pdf",
      fileSize: 128,
    }),
    approveSubmission: vi.fn(),
    rejectSubmission: vi.fn(),
    resubmitOrder: vi.fn(),
    markDelivered: vi.fn(),
    listFiles: vi.fn(),
  };
}

function createFileStorage(): FileStoragePort {
  return {
    save: vi.fn(),
    read: vi.fn().mockResolvedValue({
      fileId: "file_123",
      fileName: "rx.pdf",
      contentType: "application/pdf",
      body: Buffer.from("%PDF-1.4"),
    }),
    delete: vi.fn(),
    reset: vi.fn(),
  };
}

describe("FilesService", () => {
  it("allows admins to read any stored file", async () => {
    const service = new FilesService(
      createWorkflowStore("user_customer"),
      createFileStorage(),
    );
    const admin: AuthSession = {
      userId: "user_admin",
      email: "admin@example.com",
      role: "admin",
    };

    await expect(service.getFile("file_123", admin)).resolves.toMatchObject({
      fileId: "file_123",
      fileName: "rx.pdf",
    });
  });

  it("hides files from customers who do not own the order", async () => {
    const service = new FilesService(
      createWorkflowStore("user_customer"),
      createFileStorage(),
    );
    const otherCustomer: AuthSession = {
      userId: "user_other",
      email: "other@example.com",
      role: "customer",
    };

    await expect(
      service.getFile("file_123", otherCustomer),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
