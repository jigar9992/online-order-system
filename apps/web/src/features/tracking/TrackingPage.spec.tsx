import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  OrderSummary,
  PrescriptionSubmission,
} from "@online-order-system/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrackingPage } from "./TrackingPage.js";

const { apiGetMock, apiPostMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
}));

vi.mock("../../lib/api/client.js", () => ({
  ApiError: class MockApiError extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message);
    }
  },
  buildApiUrl: (path: string) => `http://localhost:3000/api${path}`,
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  apiPost: (...args: unknown[]) => apiPostMock(...args),
}));

const createObjectUrlMock = vi.fn(() => "blob:tracking-preview");
const revokeObjectUrlMock = vi.fn();

function createOrderSummary(overrides?: Partial<OrderSummary>): OrderSummary {
  return {
    id: "order_123",
    customerId: "user_customer",
    status: "pending",
    latestSubmissionId: "sub_001",
    latestDecision: "rejected",
    history: [
      {
        submissionId: "sub_001",
        status: "pending",
        actorId: "user_customer",
        reason: null,
        createdAt: "2026-04-21T10:00:00.000Z",
      },
      {
        submissionId: "sub_001",
        status: "rejected",
        actorId: "user_admin",
        reason: "Please upload a clearer image.",
        createdAt: "2026-04-21T10:30:00.000Z",
      },
    ],
    ...overrides,
  };
}

function createResubmissionResponse(): PrescriptionSubmission {
  return {
    id: "sub_002",
    orderId: "order_123",
    customerId: "user_customer",
    fileId: "file_002",
    fileName: "replacement.pdf",
    fileKind: "pdf",
    status: "pending",
    rejectionReason: null,
    createdAt: "2026-04-21T11:00:00.000Z",
    reviewedAt: null,
  };
}

describe("TrackingPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectUrlMock,
    });
  });

  it("loads order status and workflow history by order reference", async () => {
    const user = userEvent.setup();
    apiGetMock.mockResolvedValue(createOrderSummary());

    render(<TrackingPage />);

    await user.type(screen.getByLabelText(/order reference/i), "order_123");
    await user.click(screen.getByRole("button", { name: /load tracking/i }));

    expect(await screen.findByText("Order order_123")).toBeVisible();
    expect(
      screen.getByText(
        "Latest rejection reason: Please upload a clearer image.",
      ),
    ).toBeVisible();
    expect(screen.getAllByText("Submission sub_001")).toHaveLength(2);
  });

  it("resubmits a rejected order with multipart data and refreshes tracking", async () => {
    const user = userEvent.setup();
    apiGetMock
      .mockResolvedValueOnce(createOrderSummary())
      .mockResolvedValueOnce(
        createOrderSummary({
          latestSubmissionId: "sub_002",
          latestDecision: "pending",
          history: [
            ...createOrderSummary().history,
            {
              submissionId: "sub_002",
              status: "pending",
              actorId: "user_customer",
              reason: null,
              createdAt: "2026-04-21T11:00:00.000Z",
            },
          ],
        }),
      );
    apiPostMock.mockResolvedValue(createResubmissionResponse());

    render(<TrackingPage />);

    await user.type(screen.getByLabelText(/order reference/i), "order_123");
    await user.click(screen.getByRole("button", { name: /load tracking/i }));
    await screen.findByText("Order order_123");

    const file = new File(["pdf"], "replacement.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText(/select replacement file/i), file);
    await user.click(
      screen.getByRole("button", { name: /submit replacement/i }),
    );

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(1);
    });

    const [path, body] = apiPostMock.mock.calls[0] as [string, FormData];
    expect(path).toBe("/customer/orders/order_123/resubmit");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);

    expect(await screen.findByRole("status")).toHaveTextContent(
      /replacement uploaded/i,
    );
    expect(screen.getByText("Submission sub_002")).toBeVisible();
    expect(apiGetMock).toHaveBeenLastCalledWith("/customer/orders/order_123");
  });
});
