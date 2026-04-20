import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PrescriptionSubmission } from "@online-order-system/types";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewQueuePage } from "./ReviewQueuePage.js";

const { apiGetMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
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
  apiPost: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ReviewQueuePage />
    </MemoryRouter>,
  );
}

function createSubmission(
  id: string,
  fileName: string,
  customerId = "user_customer",
): PrescriptionSubmission {
  return {
    id,
    orderId: `${id}_order`,
    customerId,
    fileId: `${id}_file`,
    fileName,
    fileKind: "image",
    status: "pending",
    rejectionReason: null,
    createdAt: "2026-04-21T10:00:00.000Z",
    reviewedAt: null,
  };
}

describe("ReviewQueuePage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
  });

  it("loads pending reviews and applies a local filter", async () => {
    const user = userEvent.setup();
    apiGetMock.mockResolvedValue([
      createSubmission("sub_001", "rx-alpha.png"),
      createSubmission("sub_002", "rx-beta.pdf", "user_other"),
    ]);

    renderPage();

    expect(
      await screen.findAllByRole("link", { name: /open detail/i }),
    ).toHaveLength(2);
    expect(screen.getByText("rx-alpha.png")).toBeVisible();
    expect(screen.getByText("rx-beta.pdf")).toBeVisible();

    await user.type(screen.getByLabelText(/filter queue/i), "beta");

    expect(screen.queryByText("rx-alpha.png")).not.toBeInTheDocument();
    expect(screen.getByText("rx-beta.pdf")).toBeVisible();
    expect(apiGetMock).toHaveBeenCalledWith("/admin/reviews?status=pending");
  });
});
