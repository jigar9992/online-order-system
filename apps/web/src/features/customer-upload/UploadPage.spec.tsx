import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PrescriptionSubmission } from "@online-order-system/types";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UploadPage } from "./UploadPage.js";
import { maxPrescriptionUploadSizeBytes } from "./upload-constraints.js";

const { apiPostMock } = vi.hoisted(() => ({
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
  apiPost: (...args: unknown[]) => apiPostMock(...args),
}));

const createObjectUrlMock = vi.fn(() => "blob:preview-url");
const revokeObjectUrlMock = vi.fn();

function createSubmissionResponse(): PrescriptionSubmission {
  return {
    id: "submission_123",
    orderId: "order_456",
    customerId: "customer_789",
    fileId: "file_123",
    fileName: "prescription.png",
    fileKind: "image",
    status: "pending",
    rejectionReason: null,
    createdAt: "2026-04-21T10:00:00.000Z",
    reviewedAt: null,
  };
}

function renderPage(
  initialEntry:
    | string
    | { pathname: string; state?: { flashMessage?: string } | null } = {
    pathname: "/customer/upload",
  },
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/customer/upload" element={<UploadPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("UploadPage", () => {
  beforeEach(() => {
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

  it("renders a local preview for a supported image file", async () => {
    const user = userEvent.setup();
    renderPage();

    const file = new File(["image"], "prescription.png", { type: "image/png" });

    await user.upload(screen.getByLabelText(/select file/i), file);

    expect(screen.getByText("prescription.png")).toBeVisible();
    expect(
      screen.getByAltText(/preview of prescription\.png/i),
    ).toHaveAttribute("src", "blob:preview-url");
    expect(
      screen.getByRole("link", { name: /open full preview/i }),
    ).toHaveAttribute("href", "blob:preview-url");
  });

  it("shows an inline error for unsupported file types", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPage();

    const file = new File(["notes"], "notes.txt", { type: "text/plain" });

    await user.upload(screen.getByLabelText(/select file/i), file);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /unsupported file type/i,
    );
    expect(
      screen.getByRole("button", { name: /submit prescription/i }),
    ).toBeDisabled();
  });

  it("blocks files larger than the shared upload limit", async () => {
    const user = userEvent.setup();
    renderPage();

    const file = new File(["image"], "large.png", { type: "image/png" });
    Object.defineProperty(file, "size", {
      configurable: true,
      value: maxPrescriptionUploadSizeBytes + 1,
    });

    await user.upload(screen.getByLabelText(/select file/i), file);

    expect(screen.getByRole("alert")).toHaveTextContent(/file is too large/i);
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("redirects back to upload with a success flash after a successful upload", async () => {
    const user = userEvent.setup();
    let resolveUpload: ((value: PrescriptionSubmission) => void) | undefined;
    apiPostMock.mockImplementation(
      () =>
        new Promise<PrescriptionSubmission>((resolve) => {
          resolveUpload = resolve;
        }),
    );

    renderPage();

    const file = new File(["image"], "prescription.png", { type: "image/png" });

    await user.upload(screen.getByLabelText(/select file/i), file);
    await user.click(
      screen.getByRole("button", { name: /submit prescription/i }),
    );

    expect(screen.getByRole("button", { name: /uploading/i })).toBeDisabled();

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledTimes(1);
    });

    const [path, body] = apiPostMock.mock.calls[0] as [string, FormData];
    expect(path).toBe("/customer/submissions");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);

    resolveUpload?.(createSubmissionResponse());

    expect(await screen.findByRole("status")).toHaveTextContent(
      /prescription uploaded successfully/i,
    );
    expect(screen.getByText(/choose a file to preview it here/i)).toBeVisible();
    expect(screen.queryByText("prescription.png")).not.toBeInTheDocument();
    expect(screen.queryByText("order_456")).not.toBeInTheDocument();
  });

  it("shows an inline API failure without clearing the selected file", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("../../lib/api/client.js");
    apiPostMock.mockRejectedValue(
      new ApiError(500, "Upload failed on server."),
    );

    renderPage();

    const file = new File(["image"], "prescription.png", { type: "image/png" });

    await user.upload(screen.getByLabelText(/select file/i), file);
    await user.click(
      screen.getByRole("button", { name: /submit prescription/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /upload failed on server/i,
    );
    expect(screen.getByText("prescription.png")).toBeVisible();
  });
});
