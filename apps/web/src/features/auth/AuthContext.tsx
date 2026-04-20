import { useEffect, useState, type ReactNode } from "react";
import type { AuthSession, LoginRequest } from "@online-order-system/types";
import { ApiError, apiGet, apiPost } from "../../lib/api/client.js";
import { AuthContext, type AuthStatus } from "./auth-context.js";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthSession | null>(null);

  async function refreshSession() {
    try {
      const session = await apiGet<AuthSession>("/auth/me");
      setUser(session);
      setStatus("authenticated");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      setUser(null);
      setStatus("unauthenticated");
      throw error;
    }
  }

  async function login(credentials: LoginRequest): Promise<AuthSession> {
    const session = await apiPost<LoginRequest, AuthSession>(
      "/auth/login",
      credentials,
    );
    setUser(session);
    setStatus("authenticated");
    return session;
  }

  async function logout(): Promise<void> {
    await apiPost<undefined, void>("/auth/logout");
    setUser(null);
    setStatus("unauthenticated");
  }

  useEffect(() => {
    let isActive = true;

    void apiGet<AuthSession>("/auth/me")
      .then((session) => {
        if (!isActive) {
          return;
        }

        setUser(session);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
          setStatus("unauthenticated");
          return;
        }

        setUser(null);
        setStatus("unauthenticated");
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
