import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from "@nestjs/common";
import { AuthTokenService } from "./auth-token.service.js";
import type { AuthenticatedRequest } from "./auth.types.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.authTokenService.readAuthCookie(request.headers.cookie);

    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    const session = this.authTokenService.verifyToken(token);
    if (!session) {
      throw new UnauthorizedException("Authentication required");
    }

    request.user = session;
    return true;
  }
}
