import { Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthSession } from "@online-order-system/types";
import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_TTL_SECONDS,
  getAuthJwtSecret,
  shouldUseSecureAuthCookie,
} from "./auth.constants.js";
import type { AuthTokenPayload } from "./auth.types.js";

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function serializeCookie(name: string, value: string, maxAge: number): string {
  const attributes = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (shouldUseSecureAuthCookie()) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const pair of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = pair.trim().split("=");
    if (!rawName || rawValue.length === 0) {
      continue;
    }

    cookies.set(rawName, rawValue.join("="));
  }

  return cookies;
}

@Injectable()
export class AuthTokenService {
  private readonly secret = getAuthJwtSecret();

  createAuthCookie(session: AuthSession): string {
    return serializeCookie(
      AUTH_COOKIE_NAME,
      this.signToken(session),
      AUTH_TOKEN_TTL_SECONDS,
    );
  }

  createLogoutCookie(): string {
    return serializeCookie(AUTH_COOKIE_NAME, "", 0);
  }

  readAuthCookie(cookieHeader: string | undefined): string | null {
    return parseCookies(cookieHeader).get(AUTH_COOKIE_NAME) ?? null;
  }

  verifyToken(token: string): AuthSession | null {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const encodedHeader = parts[0];
    const encodedPayload = parts[1];
    const signature = parts[2];
    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }

    const payloadSignature = this.sign(`${encodedHeader}.${encodedPayload}`);

    const signatureBuffer = Buffer.from(signature, "utf8");
    const payloadSignatureBuffer = Buffer.from(payloadSignature, "utf8");
    if (
      signatureBuffer.length !== payloadSignatureBuffer.length ||
      !timingSafeEqual(signatureBuffer, payloadSignatureBuffer)
    ) {
      return null;
    }

    try {
      const payload = JSON.parse(
        decodeBase64Url(encodedPayload),
      ) as AuthTokenPayload;

      if (
        typeof payload.exp !== "number" ||
        typeof payload.iat !== "number" ||
        payload.exp <= Math.floor(Date.now() / 1000)
      ) {
        return null;
      }

      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  private signToken(session: AuthSession): string {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const payload: AuthTokenPayload = {
      ...session,
      iat: nowInSeconds,
      exp: nowInSeconds + AUTH_TOKEN_TTL_SECONDS,
    };

    const encodedHeader = encodeBase64Url(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    );
    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private sign(value: string): string {
    return createHmac("sha256", this.secret).update(value).digest("base64url");
  }
}
