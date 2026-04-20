export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 8;
const DEFAULT_AUTH_JWT_SECRET = "dev-only-auth-secret-change-me";

export function getAuthJwtSecret(): string {
  return process.env.AUTH_JWT_SECRET?.trim() || DEFAULT_AUTH_JWT_SECRET;
}

export function shouldUseSecureAuthCookie(): boolean {
  return process.env.AUTH_COOKIE_SECURE === "true";
}
