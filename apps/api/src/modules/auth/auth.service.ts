import { Inject, Injectable } from "@nestjs/common";
import { WORKFLOW_STORE } from "../../common/tokens.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";

@Injectable()
export class AuthService {
  constructor(
    @Inject(WORKFLOW_STORE) private readonly workflowStore: WorkflowStore,
  ) {}

  async login(
    email: string,
    _password: string,
  ): Promise<{ id: string; email: string; role: "customer" | "admin" } | null> {
    return this.workflowStore.getCurrentUser(email);
  }
}
