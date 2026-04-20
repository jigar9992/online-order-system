import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AuthSession } from "@online-order-system/types";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";
import { AuthProvider } from "../features/auth/AuthContext.js";
import { ApiError } from "../lib/api/client.js";

const { apiGetMock, apiPostMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
}));

vi.mock("../lib/api/client.js", () => ({
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

function renderApp(initialPath: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("auth app shell", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
  });

  it("redirects a signed-out user from protected routes to login after auth bootstrap", async () => {
    apiGetMock.mockRejectedValue(new ApiError(401, "Unauthorized"));

    renderApp("/customer/upload");

    await screen.findByRole("heading", { name: /sign in/i });
    expect(
      screen.queryByRole("heading", { name: /upload prescription/i }),
    ).not.toBeInTheDocument();
  });

  it("redirects to the customer home after a successful customer login", async () => {
    const user = userEvent.setup();
    apiGetMock.mockRejectedValue(new ApiError(401, "Unauthorized"));
    apiPostMock.mockResolvedValue({
      userId: "user_customer",
      email: "customer@example.com",
      role: "customer",
    } satisfies AuthSession);

    renderApp("/login");

    await screen.findByRole("heading", { name: /sign in/i });
    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), "customer@example.com");
    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByRole("heading", { name: /upload prescription/i });
  });

  it("shows an inline error for invalid credentials without redirecting", async () => {
    const user = userEvent.setup();
    apiGetMock.mockRejectedValue(new ApiError(401, "Unauthorized"));
    apiPostMock.mockRejectedValue(new ApiError(401, "Unauthorized"));

    renderApp("/login");

    await screen.findByRole("heading", { name: /sign in/i });
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByText(/invalid email or password/i);
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  it("shows only admin navigation for an authenticated admin", async () => {
    apiGetMock.mockImplementation((path: string) => {
      if (path === "/auth/me") {
        return Promise.resolve({
          userId: "user_admin",
          email: "admin@example.com",
          role: "admin",
        } satisfies AuthSession);
      }

      if (path === "/admin/reviews?status=pending") {
        return Promise.resolve([]);
      }

      return Promise.reject(new ApiError(404, "Not found"));
    });

    renderApp("/admin/reviews");

    await screen.findByRole("heading", { name: /review queue/i });
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /admin reviews/i }),
      ).toBeVisible();
    });
    expect(
      screen.queryByRole("link", { name: /customer upload/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^tracking$/i }),
    ).not.toBeInTheDocument();
  });
});
