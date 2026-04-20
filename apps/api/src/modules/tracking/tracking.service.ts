import { Inject, Injectable } from "@nestjs/common";
import { WORKFLOW_STORE } from "../../common/tokens.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";

@Injectable()
export class TrackingService {
  constructor(
    @Inject(WORKFLOW_STORE) private readonly workflowStore: WorkflowStore,
  ) {}

  async getOrder(orderId: string) {
    return this.workflowStore.getOrderSummary(orderId);
  }
}
