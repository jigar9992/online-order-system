import { Body, Controller, Param, Post } from "@nestjs/common";
import type { CreateSubmissionRequest } from "@online-order-system/types";
import { SubmissionsService } from "./submissions.service.js";

@Controller("customer/orders")
export class CustomerOrdersController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post(":orderId/resubmit")
  async resubmit(
    @Param("orderId") orderId: string,
    @Body() body: CreateSubmissionRequest,
  ) {
    return this.submissionsService.resubmit("user_customer", orderId, body);
  }
}
