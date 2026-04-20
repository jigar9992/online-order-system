import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthSession } from "@online-order-system/types";
import { WORKFLOW_STORE } from "../../common/tokens.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";
import { AuthTokenService } from "./auth-token.service.js";

@Injectable()
export class AuthService {
  constructor(
    @Inject(WORKFLOW_STORE) private readonly workflowStore: WorkflowStore,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async login(email: string, password: string): Promise<AuthSession> {
    const session = await this.workflowStore.authenticateUser(email, password);
    if (!session) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return session;
  }

  createSessionCookie(session: AuthSession): string {
    return this.authTokenService.createAuthCookie(session);
  }

  clearSessionCookie(): string {
    return this.authTokenService.createLogoutCookie();
  }
}
