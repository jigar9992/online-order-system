import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  AdminSubmissionDetail,
  PrescriptionSubmission,
} from "@online-order-system/types";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewDetailPage } from "./ReviewDetailPage.js";

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

function ReviewQueueDestination() {
  const location = useLocation();
  const state = location.state as { flashMessage?: string } | null;

  return (
    <section>
      <h1>Review queue destination</h1>
      <p>{location.pathname}</p>
      {state?.flashMessage ? <p>{state.flashMessage}</p> : null}
    </section>
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/reviews/sub_001"]}>
      <Routes>
        <Route
          path="/admin/reviews/:submissionId"
          element={<ReviewDetailPage />}
        />
        <Route path="/admin/reviews" element={<ReviewQueueDestination />} />
      </Routes>
    </MemoryRouter>,
  );
}

function createSubmission(
  overrides?: Partial<PrescriptionSubmission>,
): PrescriptionSubmission {
  return {
    id: "sub_001",
    orderId: "order_001",
    customerId: "user_customer",
    fileId: "file_001",
    fileName: "rx-proof.png",
    fileKind: "image",
    status: "pending",
    rejectionReason: null,
    createdAt: "2026-04-21T10:00:00.000Z",
    reviewedAt: null,
    ...overrides,
  };
}

function createDetailResponse(
  overrides?: Partial<AdminSubmissionDetail>,
): AdminSubmissionDetail {
  return {
    submission: createSubmission(),
    order: {
      id: "order_001",
      customerId: "user_customer",
      status: "pending",
      latestSubmissionId: "sub_001",
      latestDecision: "pending",
      history: [],
    },
    ...overrides,
  };
}

describe("ReviewDetailPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
  });

  it("loads submission detail and approves a pending submission", async () => {
    const user = userEvent.setup();
    apiGetMock.mockResolvedValue(createDetailResponse());
    apiPostMock.mockResolvedValue(
      createDetailResponse({
        submission: createSubmission({
          status: "approved",
          reviewedAt: "2026-04-21T11:00:00.000Z",
        }),
        order: {
          id: "order_001",
          customerId: "user_customer",
          status: "approved",
          latestSubmissionId: "sub_001",
          latestDecision: "approved",
          history: [],
        },
      }),
    );

    renderPage();

    expect(await screen.findByText("rx-proof.png")).toBeVisible();
    expect(screen.getByAltText(/preview of rx-proof\.png/i)).toHaveAttribute(
      "src",
      "http://localhost:3000/api/files/file_001",
    );

    await user.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith(
        "/admin/reviews/sub_001/approve",
        undefined,
      );
    });
    expect(
      await screen.findByRole("heading", { name: /review queue destination/i }),
    ).toBeVisible();
    expect(screen.getByText("/admin/reviews")).toBeVisible();
    expect(screen.getByText("Submission approved.")).toBeVisible();
  });

  it("requires a rejection reason and updates the UI after rejection", async () => {
    const user = userEvent.setup();
    apiGetMock.mockResolvedValue(createDetailResponse());
    apiPostMock.mockResolvedValue(
      createDetailResponse({
        submission: createSubmission({
          status: "rejected",
          rejectionReason: "Image is blurred.",
          reviewedAt: "2026-04-21T11:15:00.000Z",
        }),
        order: {
          id: "order_001",
          customerId: "user_customer",
          status: "pending",
          latestSubmissionId: "sub_001",
          latestDecision: "rejected",
          history: [],
        },
      }),
    );

    renderPage();

    await screen.findByText("rx-proof.png");
    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /rejection reason is required/i,
    );

    await user.type(
      screen.getByLabelText(/rejection reason/i),
      "Image is blurred.",
    );
    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith(
        "/admin/reviews/sub_001/reject",
        { reason: "Image is blurred." },
      );
    });
    expect(
      await screen.findByRole("heading", { name: /review queue destination/i }),
    ).toBeVisible();
    expect(screen.getByText("Submission rejected.")).toBeVisible();
  });

  it("marks an approved order as delivered from the same screen", async () => {
    const user = userEvent.setup();
    apiGetMock.mockResolvedValue(
      createDetailResponse({
        submission: createSubmission({
          status: "approved",
          reviewedAt: "2026-04-21T11:00:00.000Z",
        }),
        order: {
          id: "order_001",
          customerId: "user_customer",
          status: "approved",
          latestSubmissionId: "sub_001",
          latestDecision: "approved",
          history: [],
        },
      }),
    );
    apiPostMock.mockResolvedValue({
      order: {
        id: "order_001",
        customerId: "user_customer",
        status: "delivered",
        latestSubmissionId: "sub_001",
        latestDecision: "approved",
        history: [
          {
            submissionId: "sub_001",
            scope: "submission",
            status: "approved",
            actorId: "user_admin",
            reason: null,
            createdAt: "2026-04-21T11:00:00.000Z",
          },
          {
            submissionId: null,
            scope: "order",
            status: "delivered",
            actorId: "user_admin",
            reason: null,
            createdAt: "2026-04-21T12:00:00.000Z",
          },
        ],
      },
    });

    renderPage();

    await screen.findByText("rx-proof.png");
    await user.click(screen.getByRole("button", { name: /mark delivered/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith(
        "/admin/orders/order_001/deliver",
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /order marked as delivered/i,
    );
    expect(screen.getByText("delivered")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /mark delivered/i }),
    ).not.toBeInTheDocument();
  });
});
