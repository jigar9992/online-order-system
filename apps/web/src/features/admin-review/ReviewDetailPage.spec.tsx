import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PrescriptionSubmission } from "@online-order-system/types";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/reviews/sub_001"]}>
      <Routes>
        <Route
          path="/admin/reviews/:submissionId"
          element={<ReviewDetailPage />}
        />
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

describe("ReviewDetailPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
  });

  it("loads submission detail and approves a pending submission", async () => {
    const user = userEvent.setup();
    apiGetMock.mockResolvedValue(createSubmission());
    apiPostMock.mockResolvedValue({
      submission: createSubmission({
        status: "approved",
        reviewedAt: "2026-04-21T11:00:00.000Z",
      }),
    });

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
    expect(await screen.findByRole("status")).toHaveTextContent(
      /submission approved/i,
    );
    expect(screen.getByText("approved")).toBeVisible();
  });

  it("requires a rejection reason and updates the UI after rejection", async () => {
    const user = userEvent.setup();
    apiGetMock.mockResolvedValue(createSubmission());
    apiPostMock.mockResolvedValue({
      submission: createSubmission({
        status: "rejected",
        rejectionReason: "Image is blurred.",
        reviewedAt: "2026-04-21T11:15:00.000Z",
      }),
    });

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
    expect(await screen.findByRole("status")).toHaveTextContent(
      /submission rejected/i,
    );
    expect(
      screen.getByText("Latest rejection reason: Image is blurred."),
    ).toBeVisible();
  });
});
