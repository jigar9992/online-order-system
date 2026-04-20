import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { WORKFLOW_STORE } from "../../common/tokens.js";
import type { WorkflowStore } from "../../ports/workflow-store.port.js";

@Injectable()
export class TrackingService {
  constructor(
    @Inject(WORKFLOW_STORE) private readonly workflowStore: WorkflowStore,
  ) {}

  async getOrder(orderId: string, customerId: string) {
    const orderSummary = await this.workflowStore.getOrderSummary(orderId);
    if (!orderSummary || orderSummary.customerId !== customerId) {
      throw new NotFoundException("Order not found");
    }

    return orderSummary;
  }
}
