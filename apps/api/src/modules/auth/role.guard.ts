import {
  CanActivate,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@online-order-system/types";
import { ROLES_KEY } from "./roles.decorator.js";
import type { AuthenticatedRequest } from "./auth.types.js";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenException("You do not have access to this resource");
    }

    return true;
  }
}
