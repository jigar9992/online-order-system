import { createContext } from "react";
import type { AuthSession, LoginRequest } from "@online-order-system/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthSession | null;
  login: (credentials: LoginRequest) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
