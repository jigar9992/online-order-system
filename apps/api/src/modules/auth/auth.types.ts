import type { AuthSession } from "@online-order-system/types";

export type AuthenticatedRequest = {
  headers: {
    cookie?: string;
  };
  user?: AuthSession;
};

export type HeaderWritableResponse = {
  setHeader(name: string, value: string | readonly string[]): void;
};

export type AuthTokenPayload = AuthSession & {
  iat: number;
  exp: number;
};
