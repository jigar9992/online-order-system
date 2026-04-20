import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthSession } from "@online-order-system/types";
import type { AuthenticatedRequest } from "./auth.types.js";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthSession | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
